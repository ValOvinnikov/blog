import { CONTRAST_ROLE } from '@shinefold/config/constants';

import type { TContrastPair } from './contrast-pairs';
import {
  BRAND_PRIMARY_CONTRAST,
  ERROR,
  ERROR_MUTED,
} from './contrast-surfaces';

export const STATUS_CONTRAST_PAIRS = {
  ERROR_FILL_TEXT: {
    foreground: BRAND_PRIMARY_CONTRAST,
    surfaces: [ERROR],
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: false,
  },
  SUCCESS: {
    foreground: '--success',
    surfaces: ['--success-muted'],
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: false,
  },
  WARN: {
    foreground: '--warn',
    surfaces: ['--warn-muted'],
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: false,
  },
  ERROR: {
    foreground: ERROR,
    surfaces: [ERROR_MUTED],
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: false,
  },
} as const satisfies Record<string, TContrastPair>;
