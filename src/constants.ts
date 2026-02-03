/** Breakpoints (in pixels) - keep in sync with CSS media queries */
export const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
} as const;

/** Timing values (in milliseconds) */
export const TIMING = {
  scrollDelay: 100,
  copiedFeedbackDuration: 1500,
} as const;

/** Filter generation defaults */
export const FILTER_DEFAULTS = {
  maxLoss: 1,
  maxAttempts: 100,
} as const;

/** Default colors */
export const COLORS = {
  reactBlue: '#61dafb',
} as const;
