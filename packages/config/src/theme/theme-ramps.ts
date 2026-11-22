import {
  ACHROMATIC_PALETTE,
  NEUTRAL_PALETTE,
  STATUS_PALETTE,
} from './palette-ramps';
import type { TOklchRamp } from './theme-declarations';

export const NEUTRAL_RAMP_LIGHT = {
  '--primary': NEUTRAL_PALETTE['--palette-neutral-100'],
  '--primary-subtle': NEUTRAL_PALETTE['--palette-neutral-300'],
  '--secondary': NEUTRAL_PALETTE['--palette-neutral-500'],
  '--surface': ACHROMATIC_PALETTE['--palette-achromatic-100'],
  '--surface-2': NEUTRAL_PALETTE['--palette-neutral-200'],
  '--border': NEUTRAL_PALETTE['--palette-neutral-600'],
  '--border-strong': NEUTRAL_PALETTE['--palette-neutral-700'],
  '--border-emphasis': NEUTRAL_PALETTE['--palette-neutral-900'],
  '--field-boundary': NEUTRAL_PALETTE['--palette-neutral-900'],
  '--field-boundary-tinted': NEUTRAL_PALETTE['--palette-neutral-1100'],
  '--text': NEUTRAL_PALETTE['--palette-neutral-2200'],
  '--text-muted': NEUTRAL_PALETTE['--palette-neutral-1300'],
} as const satisfies TOklchRamp;

export const NEUTRAL_RAMP_DARK = {
  '--primary': NEUTRAL_PALETTE['--palette-neutral-2600'],
  '--primary-subtle': NEUTRAL_PALETTE['--palette-neutral-2100'],
  '--secondary': NEUTRAL_PALETTE['--palette-neutral-1800'],
  '--surface': NEUTRAL_PALETTE['--palette-neutral-2000'],
  '--surface-2': NEUTRAL_PALETTE['--palette-neutral-1900'],
  '--border': NEUTRAL_PALETTE['--palette-neutral-1600'],
  '--border-strong': NEUTRAL_PALETTE['--palette-neutral-1400'],
  '--border-emphasis': NEUTRAL_PALETTE['--palette-neutral-1200'],
  '--field-boundary': NEUTRAL_PALETTE['--palette-neutral-1100'],
  '--field-boundary-tinted': NEUTRAL_PALETTE['--palette-neutral-1000'],
  '--text': NEUTRAL_PALETTE['--palette-neutral-400'],
  '--text-muted': NEUTRAL_PALETTE['--palette-neutral-800'],
} as const satisfies TOklchRamp;

export const STATUS_RAMP_LIGHT = {
  '--success': STATUS_PALETTE['--palette-success-300'],
  '--warn': STATUS_PALETTE['--palette-warn-200'],
  '--error': STATUS_PALETTE['--palette-error-300'],
  '--success-muted': STATUS_PALETTE['--palette-success-100'],
  '--warn-muted': STATUS_PALETTE['--palette-warn-100'],
  '--error-muted': STATUS_PALETTE['--palette-error-100'],
} as const satisfies TOklchRamp;

export const STATUS_RAMP_DARK = {
  '--success': STATUS_PALETTE['--palette-success-200'],
  '--warn': STATUS_PALETTE['--palette-warn-yellow-100'],
  '--error': STATUS_PALETTE['--palette-error-200'],
  '--success-muted': STATUS_PALETTE['--palette-success-400'],
  '--warn-muted': STATUS_PALETTE['--palette-warn-yellow-200'],
  '--error-muted': STATUS_PALETTE['--palette-error-400'],
} as const satisfies TOklchRamp;

export const NEUTRAL_SCRIM_RAMP = {
  '--scrim-neutral-strong': {
    ...NEUTRAL_PALETTE['--palette-neutral-2500'],
    alpha: 0.9,
  },
  '--scrim-neutral-mid': {
    ...NEUTRAL_PALETTE['--palette-neutral-1700'],
    alpha: 0.68,
  },
  '--scrim-neutral-weak': {
    ...NEUTRAL_PALETTE['--palette-neutral-1500'],
    alpha: 0.4,
  },
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
