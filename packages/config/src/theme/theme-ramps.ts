import { NEUTRAL_PALETTE, STATUS_PALETTE } from './palette-ramps';
import type { TOklchRamp } from './theme-declarations';

export const NEUTRAL_RAMP_LIGHT = {
  '--primary': NEUTRAL_PALETTE['--palette-neutral-990-2'],
  '--primary-subtle': NEUTRAL_PALETTE['--palette-neutral-965-3'],
  '--secondary': NEUTRAL_PALETTE['--palette-neutral-910-4'],
  '--surface': NEUTRAL_PALETTE['--palette-neutral-1000-0'],
  '--surface-2': NEUTRAL_PALETTE['--palette-neutral-975-3'],
  '--border': NEUTRAL_PALETTE['--palette-neutral-900-4'],
  '--border-strong': NEUTRAL_PALETTE['--palette-neutral-800-6'],
  '--border-emphasis': NEUTRAL_PALETTE['--palette-neutral-620-6'],
  '--field-boundary-tinted': NEUTRAL_PALETTE['--palette-neutral-580-6'],
  '--text': NEUTRAL_PALETTE['--palette-neutral-200-10'],
  '--text-muted': NEUTRAL_PALETTE['--palette-neutral-460-10'],
} as const satisfies TOklchRamp;

export const NEUTRAL_RAMP_DARK = {
  '--primary': NEUTRAL_PALETTE['--palette-neutral-170-6'],
  '--primary-subtle': NEUTRAL_PALETTE['--palette-neutral-200-6'],
  '--secondary': NEUTRAL_PALETTE['--palette-neutral-240-7'],
  '--surface': NEUTRAL_PALETTE['--palette-neutral-210-7'],
  '--surface-2': NEUTRAL_PALETTE['--palette-neutral-240-8'],
  '--border': NEUTRAL_PALETTE['--palette-neutral-300-8'],
  '--border-strong': NEUTRAL_PALETTE['--palette-neutral-420-10'],
  '--border-emphasis': NEUTRAL_PALETTE['--palette-neutral-550-10'],
  '--field-boundary-tinted': NEUTRAL_PALETTE['--palette-neutral-590-10'],
  '--text': NEUTRAL_PALETTE['--palette-neutral-950-4'],
  '--text-muted': NEUTRAL_PALETTE['--palette-neutral-720-8'],
} as const satisfies TOklchRamp;

export const STATUS_RAMP_LIGHT = {
  '--success': STATUS_PALETTE['--palette-success-490-150'],
  '--warn': STATUS_PALETTE['--palette-warn-520-150'],
  '--error': STATUS_PALETTE['--palette-error-530-200'],
  '--success-muted': STATUS_PALETTE['--palette-success-950-30'],
  '--warn-muted': STATUS_PALETTE['--palette-warn-950-30'],
  '--error-muted': STATUS_PALETTE['--palette-error-950-30'],
} as const satisfies TOklchRamp;

export const STATUS_RAMP_DARK = {
  '--success': STATUS_PALETTE['--palette-success-720-160'],
  '--warn': STATUS_PALETTE['--palette-warn-800-150'],
  '--error': STATUS_PALETTE['--palette-error-700-170'],
  '--success-muted': STATUS_PALETTE['--palette-success-300-50'],
  '--warn-muted': STATUS_PALETTE['--palette-warn-300-50'],
  '--error-muted': STATUS_PALETTE['--palette-error-300-50'],
} as const satisfies TOklchRamp;

export const NEUTRAL_SCRIM_RAMP = {
  '--scrim-neutral-strong': {
    ...NEUTRAL_PALETTE['--palette-neutral-180-10'],
    alpha: 0.9,
  },
  '--scrim-neutral-mid': {
    ...NEUTRAL_PALETTE['--palette-neutral-260-15'],
    alpha: 0.68,
  },
  '--scrim-neutral-weak': {
    ...NEUTRAL_PALETTE['--palette-neutral-320-20'],
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
