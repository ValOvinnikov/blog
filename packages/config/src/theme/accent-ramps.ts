import { BRAND_PALETTE, NEUTRAL_PALETTE } from './palette-ramps';
import type { TOklchRamp } from './theme-declarations';

export const ACCENT_RAMP_LIGHT = {
  '--brand-primary': BRAND_PALETTE['--palette-brand-450-170'],
  '--brand-primary-hover': BRAND_PALETTE['--palette-brand-390-170'],
  '--brand-primary-muted': BRAND_PALETTE['--palette-brand-950-30'],
  '--brand-primary-wash': BRAND_PALETTE['--palette-brand-975-15'],
  '--brand-primary-contrast': NEUTRAL_PALETTE['--palette-neutral-990-0'],
  '--brand-primary-solid': BRAND_PALETTE['--palette-brand-510-170'],
  '--brand-primary-solid-hover': BRAND_PALETTE['--palette-brand-450-170'],
} as const satisfies TOklchRamp;

export const ACCENT_RAMP_DARK = {
  '--brand-primary': BRAND_PALETTE['--palette-brand-700-160'],
  '--brand-primary-hover': BRAND_PALETTE['--palette-brand-760-160'],
  '--brand-primary-muted': BRAND_PALETTE['--palette-brand-300-60'],
  '--brand-primary-wash': BRAND_PALETTE['--palette-brand-250-40'],
  '--brand-primary-contrast': NEUTRAL_PALETTE['--palette-neutral-160-6'],
  '--brand-primary-solid': BRAND_PALETTE['--palette-brand-700-160'],
  '--brand-primary-solid-hover': BRAND_PALETTE['--palette-brand-760-160'],
} as const satisfies TOklchRamp;

export const LOGO_RAMP_LIGHT = {
  '--logo-1': BRAND_PALETTE['--palette-brand-520-170'],
  '--logo-2': BRAND_PALETTE['--palette-brand-630-160'],
  '--logo-3': BRAND_PALETTE['--palette-brand-730-130'],
  '--logo-tile': BRAND_PALETTE['--palette-brand-520-170'],
  '--logo-tile-contrast': NEUTRAL_PALETTE['--palette-neutral-1000-0'],
} as const satisfies TOklchRamp;

export const LOGO_RAMP_DARK = {
  '--logo-1': BRAND_PALETTE['--palette-brand-580-170'],
  '--logo-2': BRAND_PALETTE['--palette-brand-680-160'],
  '--logo-3': BRAND_PALETTE['--palette-brand-800-140'],
  '--logo-tile': BRAND_PALETTE['--palette-brand-800-140'],
  '--logo-tile-contrast': BRAND_PALETTE['--palette-brand-220-60'],
} as const satisfies TOklchRamp;

// A scrim darkens the photo under it in either mode, so this ramp has no dark twin.
export const IMAGE_SCRIM_RAMP = {
  '--on-image': NEUTRAL_PALETTE['--palette-neutral-1000-0'],
  '--on-image-muted': {
    ...NEUTRAL_PALETTE['--palette-neutral-1000-0'],
    alpha: 0.85,
  },
  '--scrim-brand-strong': {
    ...BRAND_PALETTE['--palette-brand-200-60'],
    alpha: 0.92,
  },
  '--scrim-brand-mid': {
    ...BRAND_PALETTE['--palette-brand-350-120'],
    alpha: 0.72,
  },
  '--scrim-brand-weak': {
    ...BRAND_PALETTE['--palette-brand-450-140'],
    alpha: 0.4,
  },
} as const satisfies TOklchRamp;
