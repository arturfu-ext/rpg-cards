/**
 * Golden-master parity tests: the TS engine must reproduce the legacy
 * engine's output byte-for-byte for every committed fixture.
 *
 * Fixtures are captured from the frozen legacy engine via
 * `pnpm golden:capture` (see tests/golden/capture.spec.ts) and committed.
 * The only host-environment inputs are injected through EngineContext:
 * icon URLs (resolved against the same origin the capture used) and the
 * legacy-measured .card-back-inner size recorded in each fixture.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { GOLDEN_ICON_BASE, GOLDEN_PAIRS, type GoldenFixture } from '../../../tests/golden/pairs';
import { card_generate_back, card_generate_front } from '../card';
import { ICON_FILES } from '../icons/manifest.gen';
import { card_pages_generate_html } from '../pages';
import type { Card, CardOptions, EngineContext } from '../types';

const ROOT = path.resolve(import.meta.dirname, '../../..');

function loadFixture(deck: string, options: string): GoldenFixture | null {
  const file = path.join(ROOT, `tests/golden/fixtures/${deck}__${options}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function loadJson<T>(rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
}

function makeCtx(fixture: GoldenFixture, mode: 'preview' | 'print'): EngineContext {
  return {
    iconUrl(name) {
      const file = (ICON_FILES as Record<string, string>)[name];
      if (!file) return null;
      return new URL(file, GOLDEN_ICON_BASE).href;
    },
    measureBackInner() {
      return fixture.backInner[mode];
    },
  };
}

describe('golden-master parity with the legacy engine', () => {
  const missing = GOLDEN_PAIRS.filter((p) => !loadFixture(p.deck, p.options));
  it('has fixtures for every golden pair (run `pnpm golden:capture` if not)', () => {
    expect(missing.map((p) => `${p.deck}__${p.options}`)).toEqual([]);
  });

  for (const pair of GOLDEN_PAIRS) {
    const fixture = loadFixture(pair.deck, pair.options);
    if (!fixture) continue;

    describe(`${pair.deck} x ${pair.options}`, () => {
      const deck = loadJson<Card[]>(`tests/golden/decks/${pair.deck}.json`);
      const options = loadJson<CardOptions>(`tests/golden/options/${pair.options}.json`);

      it('card_pages_generate_html matches byte-for-byte', () => {
        const result = card_pages_generate_html(deck, options, makeCtx(fixture, 'print'));
        expect(result.style).toBe(fixture.style);
        expect(result.pages).toEqual(fixture.pages);
        expect(result.html).toBe(fixture.html);
      });

      it('per-card front/back match in both isPreview modes', () => {
        const printCtx = makeCtx(fixture, 'print');
        const previewCtx = makeCtx(fixture, 'preview');
        deck.forEach((data, i) => {
          const expected = fixture.cards[i];
          expect(expected, `fixture missing card ${i}`).toBeDefined();
          if (!expected) return;
          expect(card_generate_front(data, options, { isPreview: false }, printCtx)).toBe(
            expected.front,
          );
          expect(card_generate_back(data, options, { isPreview: false }, printCtx)).toBe(
            expected.back,
          );
          expect(card_generate_front(data, options, { isPreview: true }, previewCtx)).toBe(
            expected.frontPreview,
          );
          expect(card_generate_back(data, options, { isPreview: true }, previewCtx)).toBe(
            expected.backPreview,
          );
        });
      });
    });
  }
});
