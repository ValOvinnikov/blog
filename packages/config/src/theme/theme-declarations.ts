import { isUndefined } from '@blog/utils/primitives';

import {
  BUTTON_SHAPE,
  DENSITY,
  HEADER_CONTROL_STYLE,
  type TButtonShape,
  type TDensity,
  type THeaderControlStyle,
} from '@blog/config/constants';

import { BORDER_COLOR } from './border-tokens';
import { atLeastSmall } from './radius-declarations';
import { RADIUS_PILL } from './radius-tokens';

export type TThemeDeclarations = Record<`--${string}`, string>;

export type TOklchStop = { l: number; c: number; h?: number; alpha?: number };

export type TOklchRamp = Record<`--${string}`, TOklchStop>;

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

export const HEADER_CONTROL_STYLE_DECLARATIONS: Record<
  THeaderControlStyle,
  TThemeDeclarations
> = {
  [HEADER_CONTROL_STYLE.OUTLINED]: {
    '--header-control-border': 'var(--border-strong)',
    '--header-control-fill': 'var(--surface)',
  },
  [HEADER_CONTROL_STYLE.SOFT]: {
    '--header-control-border': 'transparent',
    '--header-control-fill': BORDER_COLOR,
  },
  [HEADER_CONTROL_STYLE.PLAIN]: {
    '--header-control-border': 'transparent',
    '--header-control-fill': 'transparent',
  },
};

export const BUTTON_SHAPE_DECLARATIONS: Record<
  TButtonShape,
  TThemeDeclarations
> = {
  [BUTTON_SHAPE.SQUARE]: { '--radius-button': '0' },
  [BUTTON_SHAPE.ROUNDED]: { '--radius-button': atLeastSmall('--radius-sm') },
  [BUTTON_SHAPE.PILL]: { '--radius-button': RADIUS_PILL },
};

/** A stop without its own `h` takes the tenant's hue. */
export const formatOklchRamp = <TRamp extends TOklchRamp>(
  ramp: TRamp,
  hue: number,
): Record<keyof TRamp, string> => {
  return Object.fromEntries(
    Object.entries(ramp).map(([property, { l, c, h, alpha }]) => [
      property,
      isUndefined(alpha)
        ? `oklch(${l} ${c} ${h ?? hue})`
        : `oklch(${l} ${c} ${h ?? hue} / ${alpha})`,
    ]),
  ) as Record<keyof TRamp, string>;
};
