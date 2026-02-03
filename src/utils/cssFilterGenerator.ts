// Types
export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface FilterResult {
  filter: string;
  filterRaw: string;
  loss: number;
  rgb: RGB;
}

export interface FilterResultWithRetry extends FilterResult {
  attempts: number;
}

export interface FilterOptions {
  /** Prepend "brightness(0) saturate(100%)" to force non-black sources to black first */
  forceBlack?: boolean;
  /** Maximum acceptable loss for generateFilterWithRetry (default: 5) */
  maxLoss?: number;
  /** Maximum retry attempts for generateFilterWithRetry (default: 10) */
  maxAttempts?: number;
}

interface SolverResult {
  values: number[];
  loss: number;
}

// Color utilities
const clamp = (value: number): number => Math.min(255, Math.max(0, value));

const rgbToHsl = (rgb: RGB): HSL => {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 100, s: s * 100, l: l * 100 };
};

// Filter operations (pure functions that return new RGB values)
const multiplyMatrix = (rgb: RGB, matrix: number[]): RGB => ({
  r: clamp(rgb.r * matrix[0] + rgb.g * matrix[1] + rgb.b * matrix[2]),
  g: clamp(rgb.r * matrix[3] + rgb.g * matrix[4] + rgb.b * matrix[5]),
  b: clamp(rgb.r * matrix[6] + rgb.g * matrix[7] + rgb.b * matrix[8]),
});

const applyInvert = (rgb: RGB, value: number): RGB => ({
  r: clamp((value + (rgb.r / 255) * (1 - 2 * value)) * 255),
  g: clamp((value + (rgb.g / 255) * (1 - 2 * value)) * 255),
  b: clamp((value + (rgb.b / 255) * (1 - 2 * value)) * 255),
});

const applySepia = (rgb: RGB, value: number): RGB =>
  multiplyMatrix(rgb, [
    0.393 + 0.607 * (1 - value),
    0.769 - 0.769 * (1 - value),
    0.189 - 0.189 * (1 - value),
    0.349 - 0.349 * (1 - value),
    0.686 + 0.314 * (1 - value),
    0.168 - 0.168 * (1 - value),
    0.272 - 0.272 * (1 - value),
    0.534 - 0.534 * (1 - value),
    0.131 + 0.869 * (1 - value),
  ]);

const applySaturate = (rgb: RGB, value: number): RGB =>
  multiplyMatrix(rgb, [
    0.213 + 0.787 * value,
    0.715 - 0.715 * value,
    0.072 - 0.072 * value,
    0.213 - 0.213 * value,
    0.715 + 0.285 * value,
    0.072 - 0.072 * value,
    0.213 - 0.213 * value,
    0.715 - 0.715 * value,
    0.072 + 0.928 * value,
  ]);

const applyHueRotate = (rgb: RGB, angle: number): RGB => {
  const rad = (angle / 180) * Math.PI;
  const sin = Math.sin(rad);
  const cos = Math.cos(rad);
  return multiplyMatrix(rgb, [
    0.213 + cos * 0.787 - sin * 0.213,
    0.715 - cos * 0.715 - sin * 0.715,
    0.072 - cos * 0.072 + sin * 0.928,
    0.213 - cos * 0.213 + sin * 0.143,
    0.715 + cos * 0.285 + sin * 0.14,
    0.072 - cos * 0.072 - sin * 0.283,
    0.213 - cos * 0.213 - sin * 0.787,
    0.715 - cos * 0.715 + sin * 0.715,
    0.072 + cos * 0.928 + sin * 0.072,
  ]);
};

const applyLinear = (rgb: RGB, slope: number, intercept: number): RGB => ({
  r: clamp(rgb.r * slope + intercept * 255),
  g: clamp(rgb.g * slope + intercept * 255),
  b: clamp(rgb.b * slope + intercept * 255),
});

const applyBrightness = (rgb: RGB, value: number): RGB => applyLinear(rgb, value, 0);

const applyContrast = (rgb: RGB, value: number): RGB =>
  applyLinear(rgb, value, -(0.5 * value) + 0.5);

// Apply all filters in sequence
const applyFilters = (filters: number[]): RGB => {
  let rgb: RGB = { r: 0, g: 0, b: 0 };
  rgb = applyInvert(rgb, filters[0] / 100);
  rgb = applySepia(rgb, filters[1] / 100);
  rgb = applySaturate(rgb, filters[2] / 100);
  rgb = applyHueRotate(rgb, filters[3] * 3.6);
  rgb = applyBrightness(rgb, filters[4] / 100);
  rgb = applyContrast(rgb, filters[5] / 100);
  return rgb;
};

// Loss function - measures how close the filtered result is to target
const computeLoss = (filters: number[], target: RGB, targetHSL: HSL): number => {
  const result = applyFilters(filters);
  const resultHSL = rgbToHsl(result);
  return (
    Math.abs(result.r - target.r) +
    Math.abs(result.g - target.g) +
    Math.abs(result.b - target.b) +
    Math.abs(resultHSL.h - targetHSL.h) +
    Math.abs(resultHSL.s - targetHSL.s) +
    Math.abs(resultHSL.l - targetHSL.l)
  );
};

// Clamp filter values to valid ranges
const fixFilterValue = (value: number, idx: number): number => {
  let max = 100;
  if (idx === 2)
    max = 7500; // saturate
  else if (idx === 4 || idx === 5) max = 200; // brightness, contrast

  if (idx === 3) {
    // hue-rotate wraps around
    if (value > max) return value % max;
    if (value < 0) return max + (value % max);
  }
  return Math.min(max, Math.max(0, value));
};

// SPSA optimization algorithm
const spsa = (
  A: number,
  a: number[],
  c: number,
  initialValues: number[],
  iters: number,
  target: RGB,
  targetHSL: HSL
): SolverResult => {
  const alpha = 1;
  const gamma = 1 / 6;
  const values = [...initialValues];

  let best: number[] | null = null;
  let bestLoss = Infinity;

  for (let k = 0; k < iters; k++) {
    const ck = c / Math.pow(k + 1, gamma);
    const deltas = Array.from({ length: 6 }, () => (Math.random() > 0.5 ? 1 : -1));
    const highArgs = values.map((v, i) => v + ck * deltas[i]);
    const lowArgs = values.map((v, i) => v - ck * deltas[i]);

    const lossDiff =
      computeLoss(highArgs, target, targetHSL) - computeLoss(lowArgs, target, targetHSL);

    for (let i = 0; i < 6; i++) {
      const g = (lossDiff / (2 * ck)) * deltas[i];
      const ak = a[i] / Math.pow(A + k + 1, alpha);
      values[i] = fixFilterValue(values[i] - ak * g, i);
    }

    const loss = computeLoss(values, target, targetHSL);
    if (loss < bestLoss) {
      best = [...values];
      bestLoss = loss;
    }
  }

  return { values: best ?? values, loss: bestLoss };
};

// Wide search phase
const solveWide = (target: RGB, targetHSL: HSL): SolverResult => {
  const A = 5;
  const c = 15;
  const a = [60, 180, 18000, 600, 1.2, 1.2];

  let best: SolverResult = { values: [], loss: Infinity };

  for (let i = 0; best.loss > 25 && i < 3; i++) {
    const initial = [50, 20, 3750, 50, 100, 100];
    const result = spsa(A, a, c, initial, 1000, target, targetHSL);
    if (result.loss < best.loss) {
      best = result;
    }
  }

  return best;
};

// Narrow search phase (refinement)
const solveNarrow = (wide: SolverResult, target: RGB, targetHSL: HSL): SolverResult => {
  const A = wide.loss;
  const c = 2;
  const A1 = A + 1;
  const a = [0.25 * A1, 0.25 * A1, A1, 0.25 * A1, 0.2 * A1, 0.2 * A1];
  return spsa(A, a, c, wide.values, 500, target, targetHSL);
};

// Format filter values to CSS
const formatFilter = (filters: number[]): string => {
  const fmt = (idx: number, multiplier = 1) => Math.round(filters[idx] * multiplier);
  return `invert(${fmt(0)}%) sepia(${fmt(1)}%) saturate(${fmt(2)}%) hue-rotate(${fmt(3, 3.6)}deg) brightness(${fmt(4)}%) contrast(${fmt(5)}%)`;
};

// Input parsing utilities
export const hexToRgb = (hex: string): RGB | null => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const expandedHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(expandedHex);

  if (!result) return null;

  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
};

export const parseRgb = (input: string): RGB | null => {
  // Match "rgb(r, g, b)" or "r,g,b" formats
  const match =
    input.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i) ??
    input.match(/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*$/);
  if (!match) return null;

  return {
    r: clamp(parseInt(match[1], 10)),
    g: clamp(parseInt(match[2], 10)),
    b: clamp(parseInt(match[3], 10)),
  };
};

// Main solver function
const solve = (target: RGB): SolverResult => {
  const targetHSL = rgbToHsl(target);
  const wide = solveWide(target, targetHSL);
  return solveNarrow(wide, target, targetHSL);
};

const FORCE_BLACK_PREFIX = 'brightness(0) saturate(100%) ';

/**
 * Generate a CSS filter that transforms black (#000) to the target color.
 * @param color - Hex string (e.g., "#ff5733", "ff5733", "#f53") or RGB object
 * @param options - Optional settings (e.g., forceBlack to handle non-black sources)
 * @returns FilterResult with the CSS filter string and loss value
 */
export const generateFilter = (color: string | RGB, options?: FilterOptions): FilterResult => {
  let rgb: RGB | null;

  if (typeof color === 'string') {
    rgb = hexToRgb(color) ?? parseRgb(color);
    if (!rgb) {
      throw new Error(
        `Invalid color format: "${color}". Expected hex (#ff5733) or RGB (rgb(255, 87, 51), or 255, 87, 51)`
      );
    }
  } else {
    rgb = {
      r: clamp(color.r),
      g: clamp(color.g),
      b: clamp(color.b),
    };
  }

  const result = solve(rgb);
  const baseFilter = formatFilter(result.values);
  const filterStr = options?.forceBlack ? FORCE_BLACK_PREFIX + baseFilter : baseFilter;

  return {
    filter: `filter: ${filterStr};`,
    filterRaw: filterStr,
    loss: result.loss,
    rgb,
  };
};

/**
 * Generate a CSS filter, retrying if the loss is above the threshold.
 * @param color - Hex string or RGB object
 * @param options - Optional settings (maxLoss, maxAttempts, forceBlack)
 * @returns FilterResultWithRetry including the number of attempts made
 */
export const generateFilterWithRetry = (
  color: string | RGB,
  options?: FilterOptions
): FilterResultWithRetry => {
  const maxLoss = options?.maxLoss ?? 5;
  // Ensure at least 1 attempt to guarantee a result
  const maxAttempts = Math.max(1, options?.maxAttempts ?? 10);

  let best: FilterResult = generateFilter(color, options);
  let attempts = 1;

  for (let i = 1; i < maxAttempts && best.loss > maxLoss; i++) {
    attempts++;
    const result = generateFilter(color, options);
    if (result.loss < best.loss) {
      best = result;
    }
  }

  return { ...best, attempts };
};

export default generateFilter;
