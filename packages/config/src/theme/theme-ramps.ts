import type { TOklchRamp } from './theme-declarations';

export const NEUTRAL_RAMP_LIGHT = {
  '--primary': { l: 0.99, c: 0.002, h: 250 },
  '--primary-subtle': { l: 0.965, c: 0.003, h: 250 },
  '--secondary': { l: 0.91, c: 0.004, h: 250 },
  '--surface': { l: 1, c: 0, h: 0 },
  '--surface-2': { l: 0.975, c: 0.003, h: 250 },
  '--border': { l: 0.9, c: 0.004, h: 250 },
  '--border-strong': { l: 0.8, c: 0.006, h: 250 },
  '--border-emphasis': { l: 0.62, c: 0.006, h: 250 },
  '--text': { l: 0.2, c: 0.01, h: 250 },
  '--text-muted': { l: 0.46, c: 0.01, h: 250 },
  '--text-subtle': { l: 0.6, c: 0.008, h: 250 },
} as const satisfies TOklchRamp;

export const NEUTRAL_RAMP_DARK = {
  '--primary': { l: 0.17, c: 0.006, h: 250 },
  '--primary-subtle': { l: 0.2, c: 0.006, h: 250 },
  '--secondary': { l: 0.24, c: 0.007, h: 250 },
  '--surface': { l: 0.21, c: 0.007, h: 250 },
  '--surface-2': { l: 0.24, c: 0.008, h: 250 },
  '--border': { l: 0.3, c: 0.008, h: 250 },
  '--border-strong': { l: 0.42, c: 0.01, h: 250 },
  '--border-emphasis': { l: 0.55, c: 0.01, h: 250 },
  '--text': { l: 0.95, c: 0.004, h: 250 },
  '--text-muted': { l: 0.72, c: 0.008, h: 250 },
  '--text-subtle': { l: 0.56, c: 0.008, h: 250 },
} as const satisfies TOklchRamp;

export const STATUS_RAMP_LIGHT = {
  '--success': { l: 0.49, c: 0.15, h: 150 },
  '--warn': { l: 0.52, c: 0.15, h: 75 },
  '--error': { l: 0.53, c: 0.2, h: 25 },
  '--success-muted': { l: 0.95, c: 0.03, h: 150 },
  '--warn-muted': { l: 0.95, c: 0.03, h: 75 },
  '--error-muted': { l: 0.95, c: 0.03, h: 25 },
} as const satisfies TOklchRamp;

export const STATUS_RAMP_DARK = {
  '--success': { l: 0.72, c: 0.16, h: 150 },
  '--warn': { l: 0.8, c: 0.15, h: 80 },
  '--error': { l: 0.7, c: 0.17, h: 25 },
  '--success-muted': { l: 0.3, c: 0.05, h: 150 },
  '--warn-muted': { l: 0.3, c: 0.05, h: 80 },
  '--error-muted': { l: 0.3, c: 0.05, h: 25 },
} as const satisfies TOklchRamp;

export const NEUTRAL_SCRIM_RAMP = {
  '--scrim-neutral-strong': { l: 0.18, c: 0.01, h: 250, alpha: 0.9 },
  '--scrim-neutral-mid': { l: 0.26, c: 0.015, h: 250, alpha: 0.68 },
  '--scrim-neutral-weak': { l: 0.32, c: 0.02, h: 250, alpha: 0.4 },
} as const satisfies TOklchRamp;

export const CODE_SYNTAX_RAMP_LIGHT = {
  '--code-keyword': { l: 0.5, c: 0.19, h: 310 },
  '--code-property': { l: 0.5, c: 0.19, h: 15 },
  '--code-string': { l: 0.45, c: 0.14, h: 145 },
  '--code-variable': { l: 0.5, c: 0.17, h: 250 },
  '--code-constant': { l: 0.48, c: 0.14, h: 55 },
  '--code-url': { l: 0.48, c: 0.11, h: 200 },
} as const satisfies TOklchRamp;

export const CODE_SYNTAX_RAMP_DARK = {
  '--code-keyword': { l: 0.78, c: 0.14, h: 310 },
  '--code-property': { l: 0.75, c: 0.13, h: 15 },
  '--code-string': { l: 0.75, c: 0.12, h: 145 },
  '--code-variable': { l: 0.75, c: 0.13, h: 250 },
  '--code-constant': { l: 0.78, c: 0.11, h: 55 },
  '--code-url': { l: 0.75, c: 0.09, h: 200 },
} as const satisfies TOklchRamp;
