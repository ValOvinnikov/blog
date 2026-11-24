import {
  ACHROMATIC_PALETTE,
  BRAND_PALETTE,
  NEUTRAL_PALETTE,
} from './palette-ramps';
import type { TOklchRamp } from './theme-declarations';

export const ACCENT_RAMP_LIGHT = {
  '--brand-primary': BRAND_PALETTE['--palette-brand-1300'],
  '--brand-primary-hover': BRAND_PALETTE['--palette-brand-1400'],
  '--brand-primary-muted': BRAND_PALETTE['--palette-brand-200'],
  '--brand-primary-wash': BRAND_PALETTE['--palette-brand-100'],
  '--brand-primary-contrast': ACHROMATIC_PALETTE['--palette-achromatic-200'],
  '--brand-primary-solid': BRAND_PALETTE['--palette-brand-1100'],
  '--brand-primary-solid-hover': BRAND_PALETTE['--palette-brand-1300'],
} as const satisfies TOklchRamp;

export const ACCENT_RAMP_DARK = {
  '--brand-primary': BRAND_PALETTE['--palette-brand-600'],
  '--brand-primary-hover': BRAND_PALETTE['--palette-brand-400'],
  '--brand-primary-muted': BRAND_PALETTE['--palette-brand-1600'],
  '--brand-primary-wash': BRAND_PALETTE['--palette-brand-1700'],
  '--brand-primary-contrast': NEUTRAL_PALETTE['--palette-neutral-2700'],
  '--brand-primary-solid': BRAND_PALETTE['--palette-brand-600'],
  '--brand-primary-solid-hover': BRAND_PALETTE['--palette-brand-400'],
} as const satisfies TOklchRamp;

export const LOGO_RAMP_LIGHT = {
  '--logo-1': BRAND_PALETTE['--palette-brand-1000'],
  '--logo-2': BRAND_PALETTE['--palette-brand-800'],
  '--logo-3': BRAND_PALETTE['--palette-brand-500'],
  '--logo-tile': BRAND_PALETTE['--palette-brand-1000'],
  '--logo-tile-contrast': ACHROMATIC_PALETTE['--palette-achromatic-100'],
} as const satisfies TOklchRamp;

export const LOGO_TILE_RAMP_DARK = {
  '--logo-tile': BRAND_PALETTE['--palette-brand-300'],
  '--logo-tile-contrast': BRAND_PALETTE['--palette-brand-1800'],
} as const satisfies TOklchRamp;

export const LOGO_RAMP_DARK = {
  '--logo-1': BRAND_PALETTE['--palette-brand-900'],
  '--logo-2': BRAND_PALETTE['--palette-brand-700'],
  '--logo-3': BRAND_PALETTE['--palette-brand-300'],
  ...LOGO_TILE_RAMP_DARK,
} as const satisfies TOklchRamp;

// A scrim darkens the photo under it in either mode, so this ramp has no dark twin.
export const IMAGE_SCRIM_RAMP = {
  '--on-image': ACHROMATIC_PALETTE['--palette-achromatic-100'],
  '--on-image-muted': {
    ...ACHROMATIC_PALETTE['--palette-achromatic-100'],
    alpha: 0.85,
  },
  '--scrim-brand-strong': {
    ...BRAND_PALETTE['--palette-brand-1900'],
    alpha: 0.92,
  },
  '--scrim-brand-mid': {
    ...BRAND_PALETTE['--palette-brand-1500'],
    alpha: 0.72,
  },
  '--scrim-brand-weak': {
    ...BRAND_PALETTE['--palette-brand-1200'],
    alpha: 0.4,
  },
} as const satisfies TOklchRamp;
