/**
 * Persistence e2e: localStorage round-trip (debounced save, uuid stripping),
 * legacy-format migration on load (icon/color/page_zoom shims), and the file
 * open/save/import flows. Ground truth: generator/js/ui.js local_store_* and
 * file handlers, ported in src/app/persistence/{local-store,legacy,files}.ts.
 */
import fs from 'node:fs';
import path from 'node:path';
import { expect, type Page, test } from '@playwright/test';

const FIXTURE_PATH = path.join(import.meta.dirname, 'fixtures/legacy-format-deck.json');

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

async function readLocalStorage(page: Page, key: string): Promise<string | null> {
  return page.evaluate((k) => localStorage.getItem(k), key);
}

/**
 * Node-side replica of card_init + legacy_card_data
 * (src/app/persistence/legacy.ts) with the uuid omitted — i.e. exactly the
 * on-disk shape after the save path strips uuids. Key insertion order matters:
 * saved files are byte-compared against JSON.stringify of this output.
 */
function migrateLegacyCard(old: Record<string, unknown>): Record<string, unknown> {
  const card: Record<string, unknown> = {
    ...old,
    title: old.title || '',
    contents: old.contents || [],
    tags: old.tags || [],
  };
  if (card.icon != null) {
    card.icon_front = card.icon;
    delete card.icon;
  }
  if (card.color != null) {
    card.color_front = card.color;
    card.color_back = '';
    delete card.color;
  }
  if (card.icon_back_container == null) {
    card.icon_back_container = 'rounded-square';
  }
  return card;
}

test('deck state survives a reload and is saved without uuids', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'New', exact: true }).click();
  await page.getByLabel('Name', { exact: true }).fill('Persist me');

  // The store writes to localStorage after a 500ms debounce.
  await expect.poll(() => readLocalStorage(page, 'card_data')).toContain('Persist me');

  const stored = JSON.parse((await readLocalStorage(page, 'card_data')) ?? '[]') as Array<
    Record<string, unknown>
  >;
  expect(stored).toHaveLength(1);
  for (const card of stored) {
    expect(card).not.toHaveProperty('uuid');
  }

  await page.reload();
  await expect(deckRows(page)).toHaveText(['1x Persist me']);
});

test('legacy-format localStorage data is migrated on load', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'card_data',
      JSON.stringify([
        {
          count: 1,
          title: 'Old Mage',
          icon: 'crystal-ball',
          color: 'Indigo',
          contents: ['text | legacy card'],
          tags: ['old'],
        },
      ]),
    );
    localStorage.setItem('card_options', JSON.stringify({ page_zoom: '90' }));
  });
  await page.goto('./');

  await expect(deckRows(page)).toHaveText(['1x Old Mage']);
  // icon -> icon_front: the front-face icon input shows the migrated name.
  await expect(page.getByLabel('Icon name', { exact: true }).first()).toHaveValue('crystal-ball');

  // Hydration alone does not write back; edit the card so the debounced save
  // persists the migrated shapes. Poll on the edited title: card_data and
  // card_options are written by the same save(), so once the title is there
  // the rest of that snapshot is the post-edit state (polling card_options
  // alone could be satisfied by an earlier pre-edit save).
  await page.getByLabel('Name', { exact: true }).fill('Old Mage (edited)');
  await expect.poll(() => readLocalStorage(page, 'card_data')).toContain('Old Mage (edited)');

  const options = JSON.parse((await readLocalStorage(page, 'card_options')) ?? '{}') as Record<
    string,
    unknown
  >;
  expect(options).toMatchObject({ page_zoom_width: '90', page_zoom_height: '90' });
  expect(options).not.toHaveProperty('page_zoom');

  // The card is stored in the migrated shape: icon/color renamed, defaults
  // injected, uuid stripped on save (legacy_card_data + local_store_save).
  const storedCards = JSON.parse((await readLocalStorage(page, 'card_data')) ?? '[]') as Array<
    Record<string, unknown>
  >;
  expect(storedCards).toHaveLength(1);
  expect(storedCards[0]).toMatchObject({
    title: 'Old Mage (edited)',
    icon_front: 'crystal-ball',
    color_front: 'Indigo',
    color_back: '',
    icon_back_container: 'rounded-square',
  });
  expect(storedCards[0]).not.toHaveProperty('icon');
  expect(storedCards[0]).not.toHaveProperty('color');
  expect(storedCards[0]).not.toHaveProperty('uuid');
});

test('file open replaces the deck and save downloads the migrated format', async ({ page }) => {
  await page.goto('./');

  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Open…' }).click();
  await (await fileChooserPromise).setFiles(FIXTURE_PATH);

  await expect(deckRows(page)).toHaveText(['1x Old Mage', '2x Old Sword']);
  await expect(selectedRow(page)).toHaveText('1x Old Mage');
  await expect(deckRows(page).first()).toHaveAttribute('aria-selected', 'true');

  await page.getByRole('tab', { name: 'File' }).click();
  await expect(page.getByLabel('File name')).toHaveValue('legacy-format-deck');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save' }).click();
  const download = await downloadPromise;
  const saved = fs.readFileSync(await download.path(), 'utf8');

  // Byte-for-byte legacy save format: migrated cards, uuid stripped,
  // two-space indentation (ui.js ui_save_file).
  const fixtureCards = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8')) as Array<
    Record<string, unknown>
  >;
  expect(saved).toBe(JSON.stringify(fixtureCards.map(migrateLegacyCard), null, '  '));
  expect(saved.startsWith('[\n  {')).toBe(true);

  const savedCards = JSON.parse(saved) as Array<Record<string, unknown>>;
  expect(savedCards).toHaveLength(2);
  for (const card of savedCards) {
    expect(card).not.toHaveProperty('icon');
    expect(card).not.toHaveProperty('color');
    expect(card).not.toHaveProperty('uuid');
    expect(card).toHaveProperty('icon_back_container');
  }
  expect(savedCards[0]).toMatchObject({
    icon_front: 'crystal-ball',
    color_front: 'Indigo',
    color_back: '',
    icon_back_container: 'rounded-square',
  });
});

test('file import appends to the deck and selects the first imported card', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Sample deck' }).click();
  await expect(deckRows(page)).toHaveCount(SAMPLE_DECK_LENGTH);

  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Import…' }).click();
  await (await fileChooserPromise).setFiles(FIXTURE_PATH);

  await expect(deckRows(page)).toHaveCount(SAMPLE_DECK_LENGTH + 2);
  await expect(deckRows(page).nth(SAMPLE_DECK_LENGTH)).toHaveText('1x Old Mage');
  await expect(deckRows(page).nth(SAMPLE_DECK_LENGTH + 1)).toHaveText('2x Old Sword');
  await expect(selectedRow(page)).toHaveText('1x Old Mage');
});
