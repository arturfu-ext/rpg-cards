import { describe, expect, it } from 'vitest';
import {
  formatSize,
  parseSize,
  percentOf,
  ratioOf,
  scaleByPercent,
  scaleByRatio,
} from './size-math';

describe('parseSize', () => {
  it('parses CSS lengths and bare numbers', () => {
    expect(parseSize('63mm')).toEqual({ value: 63, unit: 'mm' });
    expect(parseSize('88.5 mm')).toEqual({ value: 88.5, unit: 'mm' });
    expect(parseSize('100')).toEqual({ value: 100, unit: '' });
    expect(parseSize(80)).toEqual({ value: 80, unit: '' });
    expect(parseSize('')).toBeNull();
    expect(parseSize('abc')).toBeNull();
    expect(parseSize(null)).toBeNull();
  });
});

describe('formatSize (math_format parity: 2 decimals, trimmed, no spaces)', () => {
  it('rounds and trims like common.js math_format', () => {
    expect(formatSize(50.4, 'mm')).toBe('50.4mm');
    expect(formatSize(50.0, 'mm')).toBe('50mm');
    expect(formatSize(71.590909, '')).toBe('71.59');
    expect(formatSize(100, '')).toBe('100');
  });
});

describe('zoom interlock arithmetic (ui.js:569-617)', () => {
  it('ratioOf matches math_eval(`63mm / 88mm`)', () => {
    expect(ratioOf('63mm', '88mm')).toBeCloseTo(63 / 88, 12);
    expect(ratioOf('63mm', '0mm')).toBeNull();
    expect(ratioOf('63mm', '2in')).toBeNull();
  });

  it('scaleByPercent matches math_eval(`63mm * 80 / 100`)', () => {
    expect(scaleByPercent('63mm', '80')).toBe('50.4mm');
    expect(scaleByPercent('88mm', '100')).toBe('88mm');
    expect(scaleByPercent('88mm', '33.333')).toBe('29.33mm');
  });

  it('percentOf matches math_eval(`50.4mm / 63mm * 100`)', () => {
    expect(percentOf('50.4mm', '63mm')).toBe('80');
    expect(percentOf('88mm', '88mm')).toBe('100');
  });

  it('scaleByRatio derives the coupled card-zoom dimension', () => {
    const r = ratioOf('63mm', '88mm');
    expect(r).not.toBeNull();
    expect(scaleByRatio('50.4mm', 1 / (r as number))).toBe('70.4mm');
  });
});
