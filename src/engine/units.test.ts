import { describe, expect, it } from 'vitest';
import { getOrientation } from './units';

describe('getOrientation', () => {
  it('returns portrait when width < height (mm)', () => {
    expect(getOrientation('210mm', '297mm')).toBe('portrait');
  });

  it('returns landscape when width > height (mm)', () => {
    expect(getOrientation('297mm', '210mm')).toBe('landscape');
  });

  it('returns portrait on equal dimensions (strict > in legacy common.js:185)', () => {
    expect(getOrientation('210mm', '210mm')).toBe('portrait');
  });

  it('handles inches', () => {
    expect(getOrientation('8.5in', '11in')).toBe('portrait');
    expect(getOrientation('11in', '8.5in')).toBe('landscape');
  });

  it('treats unit-less strings as mm', () => {
    expect(getOrientation('100', '200')).toBe('portrait');
    expect(getOrientation('200', '100')).toBe('landscape');
  });

  it('treats empty strings as 0mm', () => {
    expect(getOrientation('', '')).toBe('portrait');
    expect(getOrientation('10mm', '')).toBe('landscape');
  });

  it('treats null/undefined as 0mm (legacy parseUnit)', () => {
    expect(getOrientation(null, '300mm')).toBe('portrait');
    expect(getOrientation('300mm', null)).toBe('landscape');
    expect(getOrientation(undefined, undefined)).toBe('portrait');
    expect(getOrientation(null, null)).toBe('portrait');
  });

  it('treats plain numbers as mm', () => {
    expect(getOrientation(500, 300)).toBe('landscape');
    expect(getOrientation(300, 500)).toBe('portrait');
  });

  it('compares mixed units after converting to mm', () => {
    // 21cm = 210mm: equal -> portrait
    expect(getOrientation('21cm', '210mm')).toBe('portrait');
    expect(getOrientation('297mm', '21cm')).toBe('landscape');
    // 2in = 50.8mm > 5cm = 50mm
    expect(getOrientation('5cm', '2in')).toBe('portrait');
    expect(getOrientation('2in', '5cm')).toBe('landscape');
  });

  it('converts px at 1px = 25.4/96 mm', () => {
    // 100px = 26.458333...mm
    expect(getOrientation('100px', '25mm')).toBe('landscape');
    expect(getOrientation('100px', '27mm')).toBe('portrait');
  });

  it('converts pt at 1pt = 1/72 in', () => {
    // 72pt = 25.4mm
    expect(getOrientation('72pt', '25mm')).toBe('landscape');
    expect(getOrientation('72pt', '25.4mm')).toBe('portrait');
  });

  it('converts pc at 1pc = 12pt', () => {
    // 6pc = 72pt = 25.4mm
    expect(getOrientation('6pc', '25mm')).toBe('landscape');
    expect(getOrientation('6pc', '25.4mm')).toBe('portrait');
  });

  it('converts q at 1q = 0.25mm', () => {
    // 100q = 25mm
    expect(getOrientation('100q', '24mm')).toBe('landscape');
    expect(getOrientation('100q', '25mm')).toBe('portrait');
  });

  it('is case-sensitive like legacy math.js: uppercase units fall back to portrait', () => {
    expect(getOrientation('100MM', '50MM')).toBe('portrait');
    expect(getOrientation('2IN', '10mm')).toBe('portrait');
    expect(getOrientation('72PT', '1mm')).toBe('portrait');
    expect(getOrientation('100Q', '1mm')).toBe('portrait');
  });

  it('treats a bare unit string as magnitude 1 (valueless math.unit, common.js:172)', () => {
    expect(getOrientation('88mm', 'mm')).toBe('landscape');
    expect(getOrientation('cm', '5mm')).toBe('landscape');
    expect(getOrientation('in', '30mm')).toBe('portrait');
  });

  it('parses non-string non-number inputs as 0mm (legacy parseUnit fallthrough)', () => {
    expect(getOrientation('10mm', true as unknown as string)).toBe('landscape');
    expect(getOrientation([] as unknown as string, '10mm')).toBe('portrait');
  });

  it('falls back to portrait on unparsable input (legacy catch)', () => {
    expect(getOrientation('garbage', '10mm')).toBe('portrait');
    expect(getOrientation('10nonsuch', '5mm')).toBe('portrait');
    expect(getOrientation('5cm + 2in', '1mm')).toBe('portrait');
  });

  it('accepts whitespace between number and unit', () => {
    expect(getOrientation('297 mm', '210 mm')).toBe('landscape');
  });
});
