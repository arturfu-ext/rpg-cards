/**
 * Captures golden-master fixtures from the FROZEN legacy engine.
 *
 * Run via `pnpm golden:capture`. Spawns its own static server on :8081
 * serving the repo root so harness.html can load the legacy scripts/CSS.
 * Fixtures land in tests/golden/fixtures/ and are committed — they are the
 * permanent parity contract for the TS engine port.
 */
import { type ChildProcess, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { GOLDEN_ORIGIN, GOLDEN_PAIRS, type GoldenFixture } from './pairs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const FIXTURES_DIR = path.join(ROOT, 'tests/golden/fixtures');

// The legacy engine was deleted at the end of the migration (tag
// legacy-archive); the committed fixtures are the permanent parity contract.
test.skip(
  !fs.existsSync(path.join(ROOT, 'generator')),
  'legacy engine removed — fixtures are frozen (see tag legacy-archive)',
);

let server: ChildProcess;

test.beforeAll(async () => {
  // Spawn http-server via node directly: `pnpm` is a corepack shim and is not
  // reliably on PATH for child processes.
  server = spawn(
    process.execPath,
    [path.join(ROOT, 'node_modules/http-server/bin/http-server'), '.', '-p', '8081', '--silent'],
    {
      cwd: ROOT,
      stdio: 'ignore',
    },
  );
  // Wait for the server to accept connections.
  await expect
    .poll(
      async () => {
        try {
          const res = await fetch(`${GOLDEN_ORIGIN}/tests/golden/harness.html`);
          return res.status;
        } catch {
          return 0;
        }
      },
      { timeout: 15_000 },
    )
    .toBe(200);
  fs.mkdirSync(FIXTURES_DIR, { recursive: true });
});

test.afterAll(() => {
  server?.kill();
});

for (const pair of GOLDEN_PAIRS) {
  test(`capture ${pair.deck} x ${pair.options}`, async ({ page }) => {
    const deck = JSON.parse(
      fs.readFileSync(path.join(ROOT, `tests/golden/decks/${pair.deck}.json`), 'utf8'),
    );
    const options = JSON.parse(
      fs.readFileSync(path.join(ROOT, `tests/golden/options/${pair.options}.json`), 'utf8'),
    );

    await page.goto(`${GOLDEN_ORIGIN}/tests/golden/harness.html`);
    await page.waitForFunction(() => (window as { harnessReady?: boolean }).harnessReady === true);
    // Icon CSS must be applied before the engine reads computed styles.
    await page.evaluate(() => document.fonts.ready.then(() => undefined));

    const captured = await page.evaluate(
      ([deckArg, optionsArg]) => {
        /* eslint-disable -- legacy globals */
        const w = window as any;
        // Legacy add_bleed_to_style reads the card_options global, which
        // ui.js:3 keeps equal to the options passed to the generators.
        w.card_options = optionsArg;
        const generated = w.card_pages_generate_html(deckArg, optionsArg);
        const cards = (deckArg as any[]).map((data) => ({
          front: w.card_generate_front(data, optionsArg, { isPreview: false }),
          back: w.card_generate_back(data, optionsArg, { isPreview: false }),
          frontPreview: w.card_generate_front(data, optionsArg, { isPreview: true }),
          backPreview: w.card_generate_back(data, optionsArg, { isPreview: true }),
        }));
        return {
          style: generated.style as string,
          html: generated.html as string,
          pages: generated.pages as string[][],
          backInner: {
            preview: w.harness_measure_back_inner(optionsArg, true),
            print: w.harness_measure_back_inner(optionsArg, false),
          },
          cards,
        };
      },
      [deck, options] as const,
    );

    // Sanity: capture must not silently produce empty output.
    expect(captured.html.length).toBeGreaterThan(100);
    expect(captured.pages.length).toBeGreaterThan(0);

    const fixture: GoldenFixture = {
      deck: pair.deck,
      options: pair.options,
      ...captured,
    };
    fs.writeFileSync(
      path.join(FIXTURES_DIR, `${pair.deck}__${pair.options}.json`),
      `${JSON.stringify(fixture, null, 1)}\n`,
    );
  });
}
