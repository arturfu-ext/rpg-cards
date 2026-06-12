/**
 * Editor interaction tests against the built app: live-preview debounce, the
 * DOMPurify XSS boundary, the icon picker, the color picker and the title
 * fields. Legacy behavioral ground truth: generator/js/ui.js (debounced
 * contents commit ui.js:733-740, preview render ui.js:460-471).
 */
import fs from 'node:fs';
import path from 'node:path';
import { expect, type Page, test } from '@playwright/test';

const SAMPLE_DECK: unknown = JSON.parse(
  fs.readFileSync(path.resolve(import.meta.dirname, '../golden/decks/sample-deck.json'), 'utf8'),
);

/**
 * Seed the legacy localStorage key the app hydrates from at module init and
 * open the editor. Hydration selects the first card ("Burning Hands").
 */
async function openEditorWithSampleDeck(page: Page): Promise<void> {
  await page.addInitScript((deck) => {
    localStorage.setItem('card_data', JSON.stringify(deck));
  }, SAMPLE_DECK);
  await page.goto('./');
  await expect(page.getByLabel('Contents')).toBeVisible();
}

function preview(page: Page) {
  return page.locator('.rpg-cards-render');
}

test('live preview reflects contents edits after the 200ms debounce', async ({ page }) => {
  await openEditorWithSampleDeck(page);

  const contents = page.getByLabel('Contents');
  const existing = await contents.inputValue();
  await contents.fill(`${existing}\ntext | UNIQUE_SENTINEL_XYZ`);

  // The store commit is debounced by 200ms; poll the rendered preview text.
  await expect.poll(() => preview(page).innerText()).toContain('UNIQUE_SENTINEL_XYZ');
  // The sentinel must land inside the rendered front card.
  await expect(
    preview(page).locator('.card').filter({ hasText: 'UNIQUE_SENTINEL_XYZ' }),
  ).toHaveCount(1);
});

test('preview sanitizes event-handler markup in contents (XSS boundary)', async ({ page }) => {
  await openEditorWithSampleDeck(page);

  await page.getByLabel('Contents').fill('text | <img src=x onerror=window.__pwned=1>');

  // DOMPurify keeps the harmless <img> but must strip the handler.
  await expect(preview(page).locator('img[src="x"]')).toHaveCount(1);
  expect(await preview(page).innerHTML()).not.toContain('onerror');
  // Let the broken image settle (its error event has fired once complete), so
  // a surviving onerror handler could not slip past the check by racing it.
  await expect
    .poll(() =>
      preview(page)
        .locator('img[src="x"]')
        .evaluate((img) => (img as HTMLImageElement).complete),
    )
    .toBe(true);
  expect(await page.evaluate(() => '__pwned' in window)).toBe(false);
});

test('icon picker sets icon_front and renders the inline header icon', async ({ page }) => {
  await openEditorWithSampleDeck(page);

  // The front "Icons" field hosts the first icon picker in the card form.
  await page.getByRole('button', { name: 'Browse icons' }).first().click();
  await page.getByPlaceholder('Search icons...').fill('crystal');
  await page.getByRole('option', { name: 'crystal-ball', exact: true }).click();

  await expect(page.getByLabel('Icon name').first()).toHaveValue(/crystal-ball/);
  // Front icons render inline in the header (icon_inline defaults to true).
  await expect(preview(page).locator('span.card-title-inlineicon.icon-crystal-ball')).toHaveCount(
    1,
  );
});

test('icon picker survives searching and scrolling the 4199-entry list', async ({ page }) => {
  await openEditorWithSampleDeck(page);

  await page.getByRole('button', { name: 'Browse icons' }).first().click();
  await page.getByPlaceholder('Search icons...').fill('a');

  const list = page.locator('[data-slot="command-list"]');
  await expect(list.locator('[cmdk-item]').first()).toBeVisible();

  // Scroll the virtualized listbox to the bottom and back without crashing.
  await list.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await expect.poll(() => list.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  await expect(list.locator('[cmdk-item]').first()).toBeVisible();

  await list.evaluate((el) => {
    el.scrollTop = 0;
  });
  await expect(list.locator('[cmdk-item]').first()).toBeVisible();
  await expect(page.getByPlaceholder('Search icons...')).toBeVisible();
});

test('color picker applies a named swatch and a custom hex to the preview', async ({ page }) => {
  await openEditorWithSampleDeck(page);

  // "Full Plate" starts with color_front "dimgray", so Maroon is a real change.
  await page.getByRole('option', { name: '1x Full Plate' }).click();
  const frontCard = preview(page).locator('.card').first();
  await expect(frontCard).toHaveCSS('background-color', 'rgb(105, 105, 105)'); // dimgray

  const frontColorField = page
    .locator('form > div')
    .filter({ has: page.getByText('Front color', { exact: true }) });
  await frontColorField.getByRole('button').click();
  await page.getByRole('option', { name: 'Maroon', exact: true }).click();
  await expect(frontCard).toHaveCSS('background-color', 'rgb(128, 0, 0)'); // Maroon

  // Custom hex typed into the picker's free-text field.
  await frontColorField.getByRole('button').click();
  await page.getByLabel('Color value').fill('#123456');
  await expect(frontCard).toHaveCSS('background-color', 'rgb(18, 52, 86)');
});

test('title, title size and card type update the preview header markup', async ({ page }) => {
  await openEditorWithSampleDeck(page);

  const title = preview(page).locator('.card-title').first();
  await expect(title).toHaveText('Burning Hands');
  await expect(title).toHaveClass(/card-title-13/); // default_title_size

  await page.getByLabel('Name', { exact: true }).fill('Renamed Spell XYZ');
  await expect(title).toHaveText('Renamed Spell XYZ');

  await page.locator('#card-title-size').click();
  await page.getByRole('option', { name: '16pt', exact: true }).click();
  await expect(title).toHaveClass(/card-title-16/);

  await page.getByLabel('Card type').fill('Legendary Wonder');
  const type = preview(page).locator('.card-type').first();
  await expect(type).toHaveText('Legendary Wonder');
  // card_element_type renders the subtitle as a fixed 10pt title.
  await expect(type).toHaveClass(/card-title-10/);
});
