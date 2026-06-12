/**
 * Deck management e2e: card CRUD, delete confirmation, reordering, title
 * filter, clipboard copy and the totals line. Behavioral ground truth is the
 * legacy deck toolbar (generator/js/ui.js), ported in
 * src/app/components/deck/DeckPanel.tsx + src/app/store/deck-store.ts.
 */
import fs from 'node:fs';
import path from 'node:path';
import { expect, type Page, test } from '@playwright/test';

const SAMPLE_DECK_LENGTH = (
  JSON.parse(
    fs.readFileSync(path.join(import.meta.dirname, '../../src/app/data/sample-deck.json'), 'utf8'),
  ) as unknown[]
).length;

function deckRows(page: Page) {
  return page.getByRole('listbox', { name: 'Cards in deck' }).getByRole('option');
}

function selectedRow(page: Page) {
  return page.getByRole('listbox', { name: 'Cards in deck' }).locator('[aria-selected="true"]');
}

test.beforeEach(async ({ page }) => {
  await page.goto('./');
});

test('creating a card adds a list row that tracks title edits', async ({ page }) => {
  await page.getByRole('button', { name: 'New', exact: true }).click();
  await expect(deckRows(page)).toHaveText(['1x New card']);
  await expect(selectedRow(page)).toHaveText('1x New card');

  await page.getByLabel('Name', { exact: true }).fill('Fireball');
  await expect(deckRows(page)).toHaveText(['1x Fireball']);
});

test('duplicate appends a "(Copy)" row and selects it', async ({ page }) => {
  await page.getByRole('button', { name: 'New', exact: true }).click();
  await page.getByRole('button', { name: 'Duplicate' }).click();

  await expect(deckRows(page)).toHaveText(['1x New card', '1x New card (Copy)']);
  await expect(selectedRow(page)).toHaveText('1x New card (Copy)');
});

test('delete asks for confirmation by default and names the card', async ({ page }) => {
  await page.getByRole('button', { name: 'New', exact: true }).click();
  await page.getByLabel('Name', { exact: true }).fill('Doomed card');

  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Delete Doomed card?');

  await dialog.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(deckRows(page)).toHaveCount(0);
  await expect(dialog).toBeHidden();
});

test('delete is immediate when ask-before-delete is off', async ({ page }) => {
  await page.getByRole('button', { name: 'New', exact: true }).click();
  await expect(deckRows(page)).toHaveCount(1);

  await page.getByLabel('Ask before deleting').uncheck();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();

  await expect(deckRows(page)).toHaveCount(0);
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('move buttons reorder the selected card', async ({ page }) => {
  await page.getByRole('button', { name: 'Sample deck' }).click();
  await expect(deckRows(page)).toHaveCount(SAMPLE_DECK_LENGTH);
  // The sample loader selects the first added card.
  await expect(selectedRow(page)).toHaveText('1x Burning Hands');
  await expect(deckRows(page).first()).toHaveText('1x Burning Hands');

  await page.getByRole('button', { name: 'Move down' }).click();
  await expect(deckRows(page).nth(0)).toHaveText('1x Cunning Action');
  await expect(deckRows(page).nth(1)).toHaveText('1x Burning Hands');

  await page.getByRole('button', { name: 'Move up' }).click();
  await expect(deckRows(page).first()).toHaveText('1x Burning Hands');

  await page.getByRole('button', { name: 'Move to bottom' }).click();
  await expect(deckRows(page).last()).toHaveText('1x Burning Hands');
  await expect(deckRows(page).first()).toHaveText('1x Cunning Action');

  await page.getByRole('button', { name: 'Move to top' }).click();
  await expect(deckRows(page).first()).toHaveText('1x Burning Hands');
  await expect(deckRows(page)).toHaveCount(SAMPLE_DECK_LENGTH);
});

test('title filter hides non-matching rows as a regex', async ({ page }) => {
  await page.getByRole('button', { name: 'Sample deck' }).click();
  await expect(deckRows(page)).toHaveCount(SAMPLE_DECK_LENGTH);

  const search = page.getByLabel('Filter cards by title');
  await search.fill('potion|goblin');
  await expect(deckRows(page)).toHaveText(['2x Potion of Healing', '1x Goblin']);

  await search.fill('');
  await expect(deckRows(page)).toHaveCount(SAMPLE_DECK_LENGTH);
});

test.describe('clipboard', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  test('copy puts the selected card JSON on the clipboard', async ({ page }) => {
    await page.getByRole('button', { name: 'New', exact: true }).click();
    await page.getByLabel('Name', { exact: true }).fill('Clipboard card');

    await page.getByRole('button', { name: 'Copy', exact: true }).click();
    await expect(page.getByText('Card "Clipboard card" was copied to the clipboard')).toBeVisible();

    const card = JSON.parse(await page.evaluate(() => navigator.clipboard.readText())) as Record<
      string,
      unknown
    >;
    expect(card.title).toBe('Clipboard card');
  });
});

test('total count line tracks count field edits', async ({ page }) => {
  await page.getByRole('button', { name: 'New', exact: true }).click();
  await expect(page.getByText('Contains 1 unique cards, 1 in total.')).toBeVisible();

  await page.getByLabel('Count', { exact: true }).fill('3');
  await expect(deckRows(page)).toHaveText(['3x New card']);
  await expect(page.getByText('Contains 1 unique cards, 3 in total.')).toBeVisible();

  await page.getByRole('button', { name: 'New', exact: true }).click();
  await expect(page.getByText('Contains 2 unique cards, 4 in total.')).toBeVisible();
});
