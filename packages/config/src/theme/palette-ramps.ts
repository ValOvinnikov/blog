import { formatOklchRamp, type TOklchStop } from './theme-declarations';

export type TPalette = Record<`--palette-${string}`, Omit<TOklchStop, 'alpha'>>;

export const ACHROMATIC_PALETTE = {
  '--palette-achromatic-100': { l: 1, c: 0, h: 0 },
  '--palette-achromatic-200': { l: 0.99, c: 0, h: 0 },
  '--palette-achromatic-300': { l: 0, c: 0, h: 0 },
} as const satisfies TPalette;

export const NEUTRAL_PALETTE = {
  '--palette-neutral-100': { l: 0.99, c: 0.002, h: 250 },
  '--palette-neutral-200': { l: 0.975, c: 0.003, h: 250 },
  '--palette-neutral-300': { l: 0.965, c: 0.003, h: 250 },
  '--palette-neutral-400': { l: 0.95, c: 0.004, h: 250 },
  '--palette-neutral-500': { l: 0.91, c: 0.004, h: 250 },
  '--palette-neutral-600': { l: 0.9, c: 0.004, h: 250 },
  '--palette-neutral-700': { l: 0.8, c: 0.006, h: 250 },
  '--palette-neutral-800': { l: 0.72, c: 0.008, h: 250 },
  '--palette-neutral-900': { l: 0.62, c: 0.006, h: 250 },
  '--palette-neutral-1000': { l: 0.59, c: 0.01, h: 250 },
  '--palette-neutral-1100': { l: 0.58, c: 0.006, h: 250 },
  '--palette-neutral-1200': { l: 0.55, c: 0.01, h: 250 },
  '--palette-neutral-1300': { l: 0.46, c: 0.01, h: 250 },
  '--palette-neutral-1400': { l: 0.42, c: 0.01, h: 250 },
  '--palette-neutral-1500': { l: 0.32, c: 0.02, h: 250 },
  '--palette-neutral-1600': { l: 0.3, c: 0.008, h: 250 },
  '--palette-neutral-1700': { l: 0.26, c: 0.015, h: 250 },
  '--palette-neutral-1800': { l: 0.24, c: 0.007, h: 250 },
  '--palette-neutral-1900': { l: 0.24, c: 0.008, h: 250 },
  '--palette-neutral-2000': { l: 0.21, c: 0.007, h: 250 },
  '--palette-neutral-2100': { l: 0.2, c: 0.006, h: 250 },
  '--palette-neutral-2200': { l: 0.2, c: 0.01, h: 250 },
  '--palette-neutral-2300': { l: 0.2, c: 0.02, h: 250 },
  '--palette-neutral-2400': { l: 0.2, c: 0.04, h: 250 },
  '--palette-neutral-2500': { l: 0.18, c: 0.01, h: 250 },
  '--palette-neutral-2600': { l: 0.17, c: 0.006, h: 250 },
  '--palette-neutral-2700': { l: 0.16, c: 0.006, h: 250 },
} as const satisfies TPalette;

export const BRAND_PALETTE = {
  '--palette-brand-100': { l: 0.975, c: 0.015 },
  '--palette-brand-200': { l: 0.95, c: 0.03 },
  '--palette-brand-250': { l: 0.9, c: 0.044 },
  '--palette-brand-300': { l: 0.8, c: 0.14 },
  '--palette-brand-400': { l: 0.76, c: 0.16 },
  '--palette-brand-500': { l: 0.73, c: 0.13 },
  '--palette-brand-600': { l: 0.7, c: 0.16 },
  '--palette-brand-700': { l: 0.68, c: 0.16 },
  '--palette-brand-800': { l: 0.63, c: 0.16 },
  '--palette-brand-900': { l: 0.58, c: 0.17 },
  '--palette-brand-1000': { l: 0.52, c: 0.17 },
  '--palette-brand-1100': { l: 0.51, c: 0.17 },
  '--palette-brand-1200': { l: 0.45, c: 0.14 },
  '--palette-brand-1300': { l: 0.45, c: 0.17 },
  '--palette-brand-1400': { l: 0.39, c: 0.17 },
  '--palette-brand-1500': { l: 0.35, c: 0.12 },
  '--palette-brand-1550': { l: 0.34, c: 0.07 },
  '--palette-brand-1600': { l: 0.3, c: 0.06 },
  '--palette-brand-1700': { l: 0.25, c: 0.04 },
  '--palette-brand-1800': { l: 0.22, c: 0.06 },
  '--palette-brand-1900': { l: 0.2, c: 0.06 },
} as const satisfies TPalette;

export const STATUS_PALETTE = {
  '--palette-success-100': { l: 0.95, c: 0.03, h: 150 },
  '--palette-success-200': { l: 0.72, c: 0.16, h: 150 },
  '--palette-success-300': { l: 0.49, c: 0.15, h: 150 },
  '--palette-success-400': { l: 0.3, c: 0.05, h: 150 },
  '--palette-warn-100': { l: 0.95, c: 0.03, h: 75 },
  '--palette-warn-200': { l: 0.52, c: 0.15, h: 75 },
  '--palette-warn-yellow-100': { l: 0.8, c: 0.15, h: 80 },
  '--palette-warn-yellow-200': { l: 0.3, c: 0.05, h: 80 },
  '--palette-error-100': { l: 0.95, c: 0.03, h: 25 },
  '--palette-error-200': { l: 0.7, c: 0.17, h: 25 },
  '--palette-error-300': { l: 0.53, c: 0.2, h: 25 },
  '--palette-error-400': { l: 0.3, c: 0.05, h: 25 },
} as const satisfies TPalette;

export const PALETTE = {
  ...ACHROMATIC_PALETTE,
  ...NEUTRAL_PALETTE,
  ...BRAND_PALETTE,
  ...STATUS_PALETTE,
} as const satisfies TPalette;

export const formatPaletteDeclarations = (
  hue: number,
): Record<keyof typeof PALETTE, string> => formatOklchRamp(PALETTE, hue);
