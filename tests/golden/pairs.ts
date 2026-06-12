/**
 * Which (deck, options) combinations get golden fixtures.
 *
 * - all-directives exercises every content directive and card-level field, so
 *   it runs against content-relevant option sets.
 * - layout-matrix exercises page arrangement math, so it runs against every
 *   option set.
 * - sample-deck is the real-world regression anchor.
 *
 * Shared by capture.spec.ts (fixture generation against the legacy engine)
 * and golden.test.ts (comparison against the TS engine).
 */
export const GOLDEN_PAIRS: ReadonlyArray<{ deck: string; options: string }> = [
  { deck: 'all-directives', options: 'default' },
  { deck: 'all-directives', options: 'defaults-styling' },
  { deck: 'all-directives', options: 'no-crop-marks' },
  { deck: 'all-directives', options: 'card-count-override' },

  { deck: 'layout-matrix', options: 'default' },
  { deck: 'layout-matrix', options: 'front-only' },
  { deck: 'layout-matrix', options: 'side-by-side' },
  { deck: 'layout-matrix', options: 'side-by-side-alt' },
  { deck: 'layout-matrix', options: 'no-bleed' },
  { deck: 'layout-matrix', options: 'no-crop-marks' },
  { deck: 'layout-matrix', options: 'landscape' },
  { deck: 'layout-matrix', options: 'zoom' },
  { deck: 'layout-matrix', options: 'grid-2x2' },
  { deck: 'layout-matrix', options: 'small-cards' },
  { deck: 'layout-matrix', options: 'card-count-override' },
  { deck: 'layout-matrix', options: 'defaults-styling' },

  { deck: 'sample-deck', options: 'default' },
  { deck: 'sample-deck', options: 'landscape' },
  { deck: 'sample-deck', options: 'zoom' },
];

/**
 * The capture harness is served from the repo root, so legacy icon CSS
 * resolves icons to <origin>/generator/icons/NAME.svg. The TS engine's test
 * context resolves manifest entries ("icons/NAME.svg") against this same
 * base, making output byte-identical with no normalization.
 */
export const GOLDEN_ORIGIN = 'http://127.0.0.1:8081';
export const GOLDEN_ICON_BASE = `${GOLDEN_ORIGIN}/generator/`;

export interface GoldenFixture {
  deck: string;
  options: string;
  /** Result of legacy card_pages_generate_html. */
  style: string;
  html: string;
  pages: string[][];
  /** Legacy-measured .card-back-inner size per isPreview mode. */
  backInner: {
    preview: { width: number; height: number };
    print: { width: number; height: number };
  };
  /** Per-card front/back HTML in both isPreview modes. */
  cards: Array<{
    front: string;
    back: string;
    frontPreview: string;
    backPreview: string;
  }>;
}
