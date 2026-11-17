import { CONTRAST_ROLE } from '@shinefold/config/constants';

import type { TContrastPair } from './contrast-pairs';
import {
  BRAND_PRIMARY_MUTED,
  ITEM_ACCENT_BRAND_SHARE,
  PRIMARY_SUBTLE,
  SECONDARY,
} from './contrast-surfaces';

export const ITEM_CONTRAST_PAIRS = {
  ITEM_ACCENT: {
    foreground: ITEM_ACCENT_BRAND_SHARE,
    surfaces: [
      '--primary',
      PRIMARY_SUBTLE,
      SECONDARY,
      '--surface',
      BRAND_PRIMARY_MUTED,
    ],
    role: CONTRAST_ROLE.DECORATIVE,
    followsAccentHue: true,
  },
} as const satisfies Record<string, TContrastPair>;
