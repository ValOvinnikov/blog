import { CONTRAST_ROLE } from '@blog/config/constants';

import type { TContrastPair } from './contrast-pairs';
import { CODE_SURFACES } from './contrast-surfaces';

export const CODE_CONTRAST_PAIRS = {
  CODE_FG: {
    foreground: '--code-fg',
    surfaces: CODE_SURFACES,
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  CODE_COMMENT: {
    foreground: '--code-comment',
    surfaces: CODE_SURFACES,
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  CODE_KEYWORD: {
    foreground: '--code-keyword',
    surfaces: CODE_SURFACES,
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  CODE_PROPERTY: {
    foreground: '--code-property',
    surfaces: CODE_SURFACES,
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  CODE_STRING: {
    foreground: '--code-string',
    surfaces: CODE_SURFACES,
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  CODE_VARIABLE: {
    foreground: '--code-variable',
    surfaces: CODE_SURFACES,
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  CODE_CONSTANT: {
    foreground: '--code-constant',
    surfaces: CODE_SURFACES,
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  CODE_URL: {
    foreground: '--code-url',
    surfaces: CODE_SURFACES,
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
} as const satisfies Record<string, TContrastPair>;
