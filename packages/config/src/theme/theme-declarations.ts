import {
  CARD_STYLE,
  DENSITY,
  RADIUS_SCALE,
  type TCardStyle,
  type TDensity,
  type TRadiusScale,
} from '@blog/config/constants';

export type TThemeDeclarations = Record<`--${string}`, string>;

type TOklchStop = { l: number; c: number; h?: number; alpha?: number };

export type TOklchRamp = Record<`--${string}`, TOklchStop>;

// Lightness and chroma stay fixed across tenants so contrast ratios hold; only the hue varies.
export const ACCENT_RAMP_LIGHT = {
  '--brand-primary': { l: 0.53, c: 0.17 },
  '--brand-primary-hover': { l: 0.47, c: 0.17 },
  '--brand-primary-muted': { l: 0.95, c: 0.03 },
  '--brand-primary-contrast': { l: 0.99, c: 0, h: 0 },
  '--brand-primary-solid': { l: 0.55, c: 0.17 },
  '--brand-primary-solid-hover': { l: 0.49, c: 0.17 },
} as const satisfies TOklchRamp;

export const ACCENT_RAMP_DARK = {
  '--brand-primary': { l: 0.7, c: 0.16 },
  '--brand-primary-hover': { l: 0.76, c: 0.16 },
  '--brand-primary-muted': { l: 0.3, c: 0.06 },
  '--brand-primary-contrast': { l: 0.16, c: 0.006, h: 250 },
  '--brand-primary-solid': { l: 0.7, c: 0.16 },
  '--brand-primary-solid-hover': { l: 0.76, c: 0.16 },
} as const satisfies TOklchRamp;

export const LOGO_RAMP_LIGHT = {
  '--logo-1': { l: 0.52, c: 0.17 },
  '--logo-2': { l: 0.63, c: 0.16 },
  '--logo-3': { l: 0.73, c: 0.13 },
} as const satisfies TOklchRamp;

export const LOGO_RAMP_DARK = {
  '--logo-1': { l: 0.58, c: 0.17 },
  '--logo-2': { l: 0.68, c: 0.16 },
  '--logo-3': { l: 0.8, c: 0.14 },
} as const satisfies TOklchRamp;

// A scrim darkens the photo under it in either mode, so this ramp has no dark twin.
export const IMAGE_SCRIM_RAMP = {
  '--on-image': { l: 1, c: 0, h: 0 },
  '--on-image-muted': { l: 1, c: 0, h: 0, alpha: 0.85 },
  '--scrim-brand-strong': { l: 0.2, c: 0.06, alpha: 0.92 },
  '--scrim-brand-mid': { l: 0.35, c: 0.12, alpha: 0.72 },
  '--scrim-brand-weak': { l: 0.45, c: 0.14, alpha: 0.4 },
} as const satisfies TOklchRamp;

export const RADIUS_DECLARATIONS: Record<TRadiusScale, TThemeDeclarations> = {
  [RADIUS_SCALE.SM]: {
    '--radius-sm': '2px',
    '--radius': '3px',
    '--radius-md': '3px',
    '--radius-lg': '5px',
    '--radius-xl': '6px',
  },
  [RADIUS_SCALE.MD]: {
    '--radius-sm': '3px',
    '--radius': '6px',
    '--radius-md': '6px',
    '--radius-lg': '10px',
    '--radius-xl': '12px',
  },
  [RADIUS_SCALE.LG]: {
    '--radius-sm': '5px',
    '--radius': '9px',
    '--radius-md': '9px',
    '--radius-lg': '15px',
    '--radius-xl': '18px',
  },
  [RADIUS_SCALE.XL]: {
    '--radius-sm': '6px',
    '--radius': '12px',
    '--radius-md': '12px',
    '--radius-lg': '20px',
    '--radius-xl': '24px',
  },
};

export const DENSITY_DECLARATIONS: Record<TDensity, TThemeDeclarations> = {
  [DENSITY.DEFAULT]: {
    '--spacing-gutter': 'clamp(1rem, 5vw, 2.5rem)',
    '--spacing-section': 'clamp(3rem, 8vw, 6rem)',
    '--spacing-page-y': 'clamp(1.5rem, 4vw, 2.5rem)',
    '--spacing-site-x': '1.5rem',
    '--spacing-site-y': '1.375rem',
    '--spacing-card-x': '1rem',
    '--spacing-card-y': '0.875rem',
    '--spacing-card-gap': '1.75rem',
    '--spacing-band': '1rem',
  },
  [DENSITY.COMPACT]: {
    '--spacing-gutter': 'clamp(0.75rem, 3.75vw, 1.875rem)',
    '--spacing-section': 'clamp(2.25rem, 6vw, 4.5rem)',
    '--spacing-page-y': 'clamp(1.125rem, 3vw, 1.875rem)',
    '--spacing-site-x': '1.125rem',
    '--spacing-site-y': '1rem',
    '--spacing-card-x': '0.75rem',
    '--spacing-card-y': '0.625rem',
    '--spacing-card-gap': '1.3125rem',
    '--spacing-band': '0.75rem',
  },
};

export const CARD_STYLE_DECLARATIONS: Record<TCardStyle, TThemeDeclarations> = {
  [CARD_STYLE.ACCENT_BAR]: {
    '--item-radius': '0',
    '--item-border-width': '0',
    '--item-accent-width': '2px',
    '--item-accent-color': 'var(--brand-primary)',
    '--item-shadow': 'none',
  },
  [CARD_STYLE.OUTLINED]: {
    '--item-radius': 'var(--radius-md)',
    '--item-border-width': '1px',
    '--item-accent-width': '1px',
    '--item-accent-color': 'var(--border)',
    '--item-shadow': 'none',
  },
};

/** A stop without its own `h` takes the tenant's hue. */
export const formatOklchRamp = <TRamp extends TOklchRamp>(
  ramp: TRamp,
  hue: number,
): Record<keyof TRamp, string> => {
  return Object.fromEntries(
    Object.entries(ramp).map(([property, { l, c, h, alpha }]) => [
      property,
      alpha === undefined
        ? `oklch(${l} ${c} ${h ?? hue})`
        : `oklch(${l} ${c} ${h ?? hue} / ${alpha})`,
    ]),
  ) as Record<keyof TRamp, string>;
};
