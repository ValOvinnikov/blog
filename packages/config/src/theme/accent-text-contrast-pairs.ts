import { CONTRAST_ROLE } from '@shinefold/config/constants';

import type { TContrastPair } from './contrast-pairs';
import { BANDS } from './contrast-surfaces';

export const ACCENT_TEXT_CONTRAST_PAIRS = {
  INFO: {
    foreground: '--info',
    surfaces: BANDS,
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  HEADING_HIGHLIGHT: {
    foreground: '--heading-highlight',
    surfaces: BANDS,
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
} as const satisfies Record<string, TContrastPair>;
