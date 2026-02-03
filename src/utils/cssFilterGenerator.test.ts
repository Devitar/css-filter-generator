import { describe, expect, it } from 'vitest';
import {
  generateFilter,
  generateFilterWithRetry,
  hexToRgb,
  parseRgb,
} from './cssFilterGenerator';

describe('hexToRgb', () => {
  it('parses 6-digit hex with hash', () => {
    expect(hexToRgb('#ff5733')).toEqual({ r: 255, g: 87, b: 51 });
  });

  it('parses 6-digit hex without hash', () => {
    expect(hexToRgb('ff5733')).toEqual({ r: 255, g: 87, b: 51 });
  });

  it('parses 3-digit shorthand hex with hash', () => {
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('parses 3-digit shorthand hex without hash', () => {
    expect(hexToRgb('000')).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('parses mixed case hex', () => {
    expect(hexToRgb('#AaBbCc')).toEqual({ r: 170, g: 187, b: 204 });
  });

  it('returns null for invalid hex', () => {
    expect(hexToRgb('invalid')).toBeNull();
    expect(hexToRgb('#gggggg')).toBeNull();
    expect(hexToRgb('#12345')).toBeNull(); // 5 digits
    expect(hexToRgb('')).toBeNull();
  });
});

describe('parseRgb', () => {
  it('parses rgb() function format', () => {
    expect(parseRgb('rgb(255, 87, 51)')).toEqual({ r: 255, g: 87, b: 51 });
  });

  it('parses rgb() with no spaces', () => {
    expect(parseRgb('rgb(255,87,51)')).toEqual({ r: 255, g: 87, b: 51 });
  });

  it('parses comma-separated format', () => {
    expect(parseRgb('255, 87, 51')).toEqual({ r: 255, g: 87, b: 51 });
  });

  it('parses comma-separated format without spaces', () => {
    expect(parseRgb('255,87,51')).toEqual({ r: 255, g: 87, b: 51 });
  });

  it('clamps values over 255 to 255', () => {
    expect(parseRgb('300, 400, 500')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('returns null for negative values (invalid RGB)', () => {
    // Regex only matches positive integers, so negative values return null
    expect(parseRgb('255, -10, 128')).toBeNull();
  });

  it('returns null for invalid rgb', () => {
    expect(parseRgb('invalid')).toBeNull();
    expect(parseRgb('255, 87')).toBeNull(); // only 2 values
    expect(parseRgb('')).toBeNull();
  });
});

describe('generateFilter', () => {
  it('generates a filter for hex input', () => {
    const result = generateFilter('#ff0000');
    expect(result.filter).toContain('filter:');
    expect(result.filterRaw).toContain('invert');
    expect(result.filterRaw).toContain('sepia');
    expect(result.rgb).toEqual({ r: 255, g: 0, b: 0 });
    expect(typeof result.loss).toBe('number');
  });

  it('generates a filter for RGB object input', () => {
    const result = generateFilter({ r: 0, g: 255, b: 0 });
    expect(result.rgb).toEqual({ r: 0, g: 255, b: 0 });
  });

  it('generates a filter for RGB string input', () => {
    const result = generateFilter('0, 0, 255');
    expect(result.rgb).toEqual({ r: 0, g: 0, b: 255 });
  });

  it('prepends forceBlack prefix when option is set', () => {
    const result = generateFilter('#ff0000', { forceBlack: true });
    expect(result.filterRaw).toContain('brightness(0) saturate(100%)');
  });

  it('does not include forceBlack prefix by default', () => {
    const result = generateFilter('#ff0000');
    expect(result.filterRaw).not.toContain('brightness(0) saturate(100%)');
  });

  it('throws error for invalid color format', () => {
    expect(() => generateFilter('invalid')).toThrow('Invalid color format');
  });

  it('clamps RGB object values', () => {
    const result = generateFilter({ r: 300, g: -50, b: 128 });
    expect(result.rgb).toEqual({ r: 255, g: 0, b: 128 });
  });
});

describe('generateFilterWithRetry', () => {
  it('returns result with attempts count', () => {
    const result = generateFilterWithRetry('#ff0000');
    expect(result.attempts).toBeGreaterThanOrEqual(1);
    expect(result.filter).toContain('filter:');
  });

  it('respects maxAttempts option', () => {
    const result = generateFilterWithRetry('#ff0000', { maxAttempts: 1 });
    expect(result.attempts).toBe(1);
  });

  it('retries until loss is acceptable', () => {
    // With a very high maxLoss, should succeed on first try
    const result = generateFilterWithRetry('#ff0000', {
      maxLoss: 100,
      maxAttempts: 10,
    });
    expect(result.attempts).toBe(1);
  });

  it('ensures at least 1 attempt even with maxAttempts of 0', () => {
    const result = generateFilterWithRetry('#ff0000', { maxAttempts: 0 });
    expect(result.attempts).toBe(1);
  });

  it('propagates forceBlack option', () => {
    const result = generateFilterWithRetry('#ff0000', { forceBlack: true });
    expect(result.filterRaw).toContain('brightness(0) saturate(100%)');
  });
});
