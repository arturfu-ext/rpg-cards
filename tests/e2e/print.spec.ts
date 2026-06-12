/**
 * Print/generate flow tests: empty-deck guard, page counts for the sample
 * deck across grid/arrangement settings, crop-mark toggling and the print
 * route chrome. Legacy ground truth: generator/js/ui.js:67-71 (empty-deck
 * guard) and the cards.js page pipeline ported to src/engine/pages.ts.
 *
 * The sample deck has 28 cards whose counts sum to 29 (one card has
 * count 2), so 3x3 doublesided => ceil(29/9) = 4 front + 4 back = 8 pages.
 */
import fs from 'node:fs';
import path from 'node:path';
import { expect, type Page, test } from '@playwright/test';

function loadJson(rel: string): unknown {
  return JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, rel), 'utf8'));
}

const SAMPLE_DECK = loadJson('../golden/decks/sample-deck.json');
const GRID_2X2_OPTIONS = loadJson('../golden/options/grid-2x2.json');

/** Seed the legacy localStorage keys the app hydrates from and open the editor. */
async function openEditor(page: Page, options?: unknown): Promise<void> {
  await page.addInitScript(
    ([deck, opts]) => {
      localStorage.setItem('card_data', JSON.stringify(deck));
      if (opts) localStorage.setItem('card_options', JSON.stringify(opts));
    },
    [SAMPLE_DECK, options ?? null] as const,
  );
  await page.goto('./');
  await expect(page.getByText('Contains 28 unique cards, 29 in total.')).toBeVisible();
}

function generateButton(page: Page) {
  return page.getByRole('button', { name: 'Generate' });
}

function backToEditorLink(page: Page) {
  return page.getByRole('link', { name: /Back to editor/ });
}

test('generate with an empty deck shows a toast and stays on the editor', async ({ page }) => {
  await openEditor(page);

  // Clear the deck, accepting the "Delete all cards?" confirmation dialog.
  await page.getByRole('button', { name: 'Delete all' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete all' }).click();
  await expect(page.getByText('Contains 0 unique cards, 0 in total.')).toBeVisible();

  await generateButton(page).click();
  await expect(page.getByText(/Your deck is empty/).first()).toBeVisible();
  // Route must stay on the editor.
  await expect(page).not.toHaveURL(/print/);
  await expect(generateButton(page)).toBeVisible();
});

test('generate renders 8 portrait pages for the sample deck (3x3 doublesided)', async ({
  page,
}) => {
  await openEditor(page);
  await generateButton(page).click();

  await expect(page).toHaveURL(/#\/print$/);
  // ceil(29/9) = 4 front pages + 4 interleaved back pages.
  await expect(page.locator('page')).toHaveCount(8);
  await expect(page.locator('page.portrait')).toHaveCount(8);
});

test('page rows/columns settings change the generated page count', async ({ page }) => {
  await openEditor(page);

  // Page tab is open by default; set a 2x2 grid.
  await page.locator('#page-columns').fill('2');
  await page.locator('#page-rows').fill('2');
  await generateButton(page).click();

  // ceil(29/4) = 8 front pages + 8 back pages.
  await expect(page.locator('page')).toHaveCount(16);
});

test('front_only arrangement halves the page count vs doublesided', async ({ page }) => {
  await openEditor(page, GRID_2X2_OPTIONS);

  // Doublesided baseline on the 2x2 grid: 8 front + 8 back pages.
  await generateButton(page).click();
  await expect(page.locator('page')).toHaveCount(16);

  await backToEditorLink(page).click();
  await page.locator('#card-arrangement').click();
  await page.getByRole('option', { name: 'Front side only' }).click();
  await generateButton(page).click();

  // Fronts only: ceil(29/4) = 8 pages.
  await expect(page.locator('page')).toHaveCount(8);
});

test('crop marks render by default and disappear when toggled off', async ({ page }) => {
  await openEditor(page);
  await generateButton(page).click();
  await expect(page.locator('page')).toHaveCount(8);

  // Engine emits hidden marks; the post-render pass un-hides the edge ones.
  await expect(page.locator('.crop-mark').first()).toBeAttached();
  await expect(page.locator('.crop-mark:not(.hide)').first()).toBeAttached();

  await backToEditorLink(page).click();
  const cropSwitch = page.getByRole('switch', { name: 'Crop marks' });
  await expect(cropSwitch).toHaveAttribute('aria-checked', 'true');
  await cropSwitch.click();
  await expect(cropSwitch).toHaveAttribute('aria-checked', 'false');

  await generateButton(page).click();
  await expect(page.locator('page')).toHaveCount(8);
  // With crop_marks off the engine emits no crop-mark elements at all.
  await expect(page.locator('.crop-mark')).toHaveCount(0);
});

test('print chrome: Print and Back buttons; Back keeps the deck intact', async ({ page }) => {
  await openEditor(page);
  await generateButton(page).click();
  await expect(page.locator('page')).toHaveCount(8);

  // Do not click Print — window.print() would block on the native dialog.
  await expect(page.getByRole('button', { name: 'Print', exact: true })).toBeEnabled();
  await expect(backToEditorLink(page)).toBeVisible();

  await backToEditorLink(page).click();
  await expect(page).toHaveURL(/#\/$/);
  await expect(page.getByText('Contains 28 unique cards, 29 in total.')).toBeVisible();
  await expect(page.getByRole('option', { name: '1x Burning Hands' })).toBeVisible();
});
