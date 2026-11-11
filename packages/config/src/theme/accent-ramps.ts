import type { TOklchRamp } from './theme-declarations';

export const ACCENT_RAMP_LIGHT = {
  '--brand-primary': { l: 0.45, c: 0.17 },
  '--brand-primary-hover': { l: 0.39, c: 0.17 },
  '--brand-primary-muted': { l: 0.95, c: 0.03 },
  '--brand-primary-wash': { l: 0.975, c: 0.015 },
  '--brand-primary-contrast': { l: 0.99, c: 0, h: 0 },
  '--brand-primary-solid': { l: 0.51, c: 0.17 },
  '--brand-primary-solid-hover': { l: 0.45, c: 0.17 },
} as const satisfies TOklchRamp;

export const ACCENT_RAMP_DARK = {
  '--brand-primary': { l: 0.7, c: 0.16 },
  '--brand-primary-hover': { l: 0.76, c: 0.16 },
  '--brand-primary-muted': { l: 0.3, c: 0.06 },
  '--brand-primary-wash': { l: 0.25, c: 0.04 },
  '--brand-primary-contrast': { l: 0.16, c: 0.006, h: 250 },
  '--brand-primary-solid': { l: 0.7, c: 0.16 },
  '--brand-primary-solid-hover': { l: 0.76, c: 0.16 },
} as const satisfies TOklchRamp;
