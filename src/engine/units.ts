// Pure-TS replacement for the math.js-based getOrientation (common.js:163-190).
// Legacy parsed sizes with math.unit(), converted both to mm and returned
// 'landscape' only for a strict width > height; any parse failure was caught
// and fell back to 'portrait'. This port keeps those semantics with a CSS
// length conversion table (and so also resolves px/pt/pc/q, which stock
// math.js rejected into the 'portrait' fallback). Like math.js the lookup is
// case-sensitive ('100MM' falls back to 'portrait') and a bare unit string
// acts as magnitude 1 (math.unit('mm') is a valueless 1mm unit).

const MM_PER_UNIT: Record<string, number> = {
  mm: 1,
  cm: 10,
  in: 25.4,
  pt: 25.4 / 72,
  pc: 25.4 / 6,
  px: 25.4 / 96,
  q: 0.25,
};

const SIZE_PATTERN = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)?\s*([a-zA-Z]+)$/;

// common.js:166-176 parseUnit: null/'' -> 0mm, numbers -> mm, non-string
// non-number inputs -> 0mm, unit-less strings -> parseFloat(value) || 0 in
// mm; anything unparsable throws into the outer catch.
function parse_to_mm(value: unknown): number {
  if (value == null || value === '') return 0;
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;
  if (/[a-zA-Z]/.test(value)) {
    const match = value.trim().match(SIZE_PATTERN);
    if (!match) {
      throw new Error('getOrientation: invalid size "' + value + '"');
    }
    const factor = MM_PER_UNIT[match[2]!];
    if (factor === undefined) {
      throw new Error('getOrientation: unknown unit "' + match[2] + '"');
    }
    return (match[1] === undefined ? 1 : parseFloat(match[1])) * factor;
  }
  return parseFloat(value) || 0;
}

export function getOrientation(
  cssWidth: string | number | null | undefined,
  cssHeight: string | number | null | undefined,
): 'landscape' | 'portrait' {
  try {
    const wVal = parse_to_mm(cssWidth);
    const hVal = parse_to_mm(cssHeight);

    return wVal > hVal ? 'landscape' : 'portrait';
  } catch {
    return 'portrait';
  }
}

// common.js:192-194
export function isLandscape(
  width: string | number | null | undefined,
  height: string | number | null | undefined,
): boolean {
  return getOrientation(width || 0, height || 0) === 'landscape';
}
