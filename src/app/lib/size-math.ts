/**
 * Minimal replacement for the math.js expressions the legacy zoom interlock
 * used (ui.js:569-617 via common.js math_eval/math_format). Handles CSS
 * lengths of the form "<number><unit>" and plain numeric strings.
 *
 * Formatting mirrors common.js math_format: round to 2 decimals, trim
 * trailing zeros, no spaces ("50.4mm", "71.59").
 */

const SIZE_RE = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)\s*([a-zA-Z%]*)$/;

interface Size {
  value: number;
  unit: string;
}

export function parseSize(input: string | number | null | undefined): Size | null {
  if (input == null) return null;
  if (typeof input === 'number') {
    return Number.isFinite(input) ? { value: input, unit: '' } : null;
  }
  const match = input.trim().match(SIZE_RE);
  if (!match) return null;
  const value = parseFloat(match[1]!);
  if (!Number.isFinite(value)) return null;
  return { value, unit: match[2] ?? '' };
}

/** common.js math_format roundAndTrim: 2 decimals, trailing zeros removed. */
export function formatSize(value: number, unit: string): string {
  let s = value.toFixed(2);
  if (s.includes('.')) s = s.replace(/\.?0+$/, '');
  if (s === '-0') s = '0';
  return `${s}${unit}`;
}

/** math_eval(`${w} / ${h}`) — dimensionless ratio, or null when invalid. */
export function ratioOf(
  width: string | number | null | undefined,
  height: string | number | null | undefined,
): number | null {
  const w = parseSize(width);
  const h = parseSize(height);
  if (!w || !h || h.value === 0) return null;
  if (w.unit !== h.unit && w.unit && h.unit) return null;
  return w.value / h.value;
}

/** math_format(math_eval(`${size} * ${factor}`)) keeping size's unit. */
export function scaleByRatio(
  size: string | number | null | undefined,
  factor: number,
): string | null {
  const s = parseSize(size);
  if (!s || !Number.isFinite(factor)) return null;
  return formatSize(s.value * factor, s.unit);
}

/** math_format(math_eval(`${size} * ${percent} / 100`)) keeping size's unit. */
export function scaleByPercent(
  size: string | number | null | undefined,
  percent: string | number | null | undefined,
): string | null {
  const s = parseSize(size);
  const p = parseSize(percent);
  if (!s || !p) return null;
  return formatSize((s.value * p.value) / 100, s.unit);
}

/** math_format(math_eval(`${part} / ${whole} * 100`)) — dimensionless percent. */
export function percentOf(
  part: string | number | null | undefined,
  whole: string | number | null | undefined,
): string | null {
  const p = parseSize(part);
  const w = parseSize(whole);
  if (!p || !w || w.value === 0) return null;
  if (p.unit !== w.unit && p.unit && w.unit) return null;
  return formatSize((p.value / w.value) * 100, '');
}
