/**
 * Print parity suite — the Phase D gate.
 *
 * For each selected golden fixture, renders the SAME page HTML two ways:
 * - legacy: posts the captured {style, html, pages, options} into the real
 *   frozen output.html (the postMessage path output.js listens on),
 * - new: seeds the app's localStorage with the deck/options and opens the
 *   #/print route, where the TS engine regenerates everything live.
 * Then screenshots each <page> element on both sides and pixel-diffs them.
 *
 * The fixture icon URLs point at the capture origin (:8081), so this spec
 * spawns the same repo-root static server the capture harness uses.
 */
import { type ChildProcess, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { expect, type Page, test } from '@playwright/test';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { GOLDEN_ORIGIN, type GoldenFixture } from '../golden/pairs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const NEW_APP = 'http://127.0.0.1:4173/rpg-cards/';
const LEGACY_OUTPUT = 'http://127.0.0.1:8080/output.html';
const DIFF_DIR = path.join(ROOT, 'test-results/print-parity-diffs');

// The legacy reference was deleted at the end of the migration (tag
// legacy-archive). Parity was proven against it before deletion; these
// tests only run where the legacy tree exists (checkout of the tag).
test.skip(
  !fs.existsSync(path.join(ROOT, 'generator')),
  'legacy reference removed — parity is frozen (see tag legacy-archive)',
);

/** Subset of golden pairs that exercises every layout/content path visually. */
const VISUAL_PAIRS = [
  { deck: 'sample-deck', options: 'default' },
  { deck: 'all-directives', options: 'default' },
  { deck: 'all-directives', options: 'defaults-styling' },
  { deck: 'layout-matrix', options: 'default' },
  { deck: 'layout-matrix', options: 'side-by-side' },
  { deck: 'layout-matrix', options: 'side-by-side-alt' },
  { deck: 'layout-matrix', options: 'landscape' },
  { deck: 'layout-matrix', options: 'no-bleed' },
  { deck: 'layout-matrix', options: 'zoom' },
  { deck: 'layout-matrix', options: 'grid-2x2' },
];

/** Pages can differ by a sliver of anti-aliasing; nothing more. */
const MAX_DIFF_RATIO = 0.002;

let iconServer: ChildProcess;

test.beforeAll(async () => {
  iconServer = spawn(
    process.execPath,
    [path.join(ROOT, 'node_modules/http-server/bin/http-server'), '.', '-p', '8081', '--silent'],
    { cwd: ROOT, stdio: 'ignore' },
  );
  await expect
    .poll(
      async () => {
        try {
          return (await fetch(`${GOLDEN_ORIGIN}/generator/css/cards.css`)).status;
        } catch {
          return 0;
        }
      },
      { timeout: 15_000 },
    )
    .toBe(200);
  fs.mkdirSync(DIFF_DIR, { recursive: true });
});

test.afterAll(() => {
  iconServer?.kill();
});

function loadFixture(deck: string, options: string): GoldenFixture {
  return JSON.parse(
    fs.readFileSync(path.join(ROOT, `tests/golden/fixtures/${deck}__${options}.json`), 'utf8'),
  );
}

function loadJson(rel: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
}

async function settle(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  // Let icon SVG background images finish decoding.
  await page.waitForLoadState('networkidle');
}

async function screenshotPages(page: Page): Promise<Buffer[]> {
  const count = await page.locator('page').count();
  const shots: Buffer[] = [];
  for (let i = 0; i < count; i++) {
    shots.push(
      await page.locator('page').nth(i).screenshot({ scale: 'css', animations: 'disabled' }),
    );
  }
  return shots;
}

for (const pair of VISUAL_PAIRS) {
  test(`print parity: ${pair.deck} x ${pair.options}`, async ({ page, context }) => {
    const fixture = loadFixture(pair.deck, pair.options);
    const deck = loadJson(`tests/golden/decks/${pair.deck}.json`);
    const options = loadJson(`tests/golden/options/${pair.options}.json`);

    // --- Legacy side: real output.html consuming the captured payload.
    await page.goto(LEGACY_OUTPUT);
    await page.evaluate(
      ([fix, opts]) => {
        window.postMessage(
          { style: fix.style, html: fix.html, pages: fix.pages, options: opts },
          '*',
        );
      },
      [fixture, options] as const,
    );
    await expect(page.locator('page').first()).toBeVisible();
    await settle(page);
    const legacyShots = await screenshotPages(page);
    expect(legacyShots.length).toBe(fixture.pages.length);

    // --- New side: seed localStorage, open the print route.
    const appPage = await context.newPage();
    await appPage.addInitScript(
      ([deckArg, optionsArg]) => {
        localStorage.setItem('card_data', JSON.stringify(deckArg));
        localStorage.setItem('card_options', JSON.stringify(optionsArg));
      },
      [deck, options] as const,
    );
    await appPage.goto(`${NEW_APP}#/print`);
    await expect(appPage.locator('page').first()).toBeVisible();
    await settle(appPage);
    const newShots = await screenshotPages(appPage);

    expect(newShots.length, 'page count must match').toBe(legacyShots.length);

    for (let i = 0; i < legacyShots.length; i++) {
      const legacyPng = PNG.sync.read(legacyShots[i] as Buffer);
      const newPng = PNG.sync.read(newShots[i] as Buffer);

      expect({ width: newPng.width, height: newPng.height }, `page ${i + 1} dimensions`).toEqual({
        width: legacyPng.width,
        height: legacyPng.height,
      });

      const diff = new PNG({ width: legacyPng.width, height: legacyPng.height });
      const diffPixels = pixelmatch(
        legacyPng.data,
        newPng.data,
        diff.data,
        legacyPng.width,
        legacyPng.height,
        { threshold: 0.1 },
      );
      const ratio = diffPixels / (legacyPng.width * legacyPng.height);
      if (ratio > MAX_DIFF_RATIO) {
        const base = `${pair.deck}__${pair.options}__page${i + 1}`;
        fs.writeFileSync(path.join(DIFF_DIR, `${base}.legacy.png`), legacyShots[i] as Buffer);
        fs.writeFileSync(path.join(DIFF_DIR, `${base}.new.png`), newShots[i] as Buffer);
        fs.writeFileSync(path.join(DIFF_DIR, `${base}.diff.png`), PNG.sync.write(diff));
      }
      expect(
        ratio,
        `page ${i + 1} pixel diff ratio (artifacts in ${DIFF_DIR} on failure)`,
      ).toBeLessThanOrEqual(MAX_DIFF_RATIO);
    }
    await appPage.close();
  });
}
