import { CONTRAST_ROLE, type TContrastRole } from '@shinefold/config/constants';

import { ACCENT_TEXT_CONTRAST_PAIRS } from './accent-text-contrast-pairs';
import { CODE_CONTRAST_PAIRS } from './code-contrast-pairs';
import {
  BANDS,
  BRAND_PRIMARY,
  BRAND_PRIMARY_CONTRAST,
  BRAND_PRIMARY_HOVER,
  BRAND_PRIMARY_MUTED,
  FIELD_SURFACES,
  FILLED_ITEM_SURFACES,
  SCRIM_STOPS_UNDER_COPY,
  TEXT,
  TEXT_SURFACES,
  TINTED_FIELD_SURFACES,
} from './contrast-surfaces';
import { HEADER_CONTRAST_PAIRS } from './header-contrast-pairs';
import { ITEM_CONTRAST_PAIRS } from './item-contrast-pairs';
import { PRESET_ROLE_CONTRAST_PAIRS } from './preset-role-contrast-pairs';
import { STATUS_CONTRAST_PAIRS } from './status-contrast-pairs';

export type TThemeToken = `--${string}`;

export type TContrastPair = {
  foreground: TThemeToken;
  surfaces: readonly TThemeToken[];
  role: TContrastRole;
  followsAccentHue: boolean;
};

export const CONTRAST_PAIRS = {
  TEXT: {
    foreground: TEXT,
    surfaces: TEXT_SURFACES,
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  TEXT_MUTED: {
    foreground: '--text-muted',
    surfaces: TEXT_SURFACES,
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  BRAND_PRIMARY: {
    foreground: BRAND_PRIMARY,
    surfaces: FILLED_ITEM_SURFACES,
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  BRAND_PRIMARY_HOVER: {
    foreground: BRAND_PRIMARY_HOVER,
    surfaces: FILLED_ITEM_SURFACES,
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  BRAND_PRIMARY_CONTRAST: {
    foreground: BRAND_PRIMARY_CONTRAST,
    surfaces: ['--brand-primary-solid', '--brand-primary-solid-hover'],
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  ...STATUS_CONTRAST_PAIRS,
  BORDER_STRONG: {
    foreground: '--border-strong',
    surfaces: FIELD_SURFACES,
    role: CONTRAST_ROLE.UI_BOUNDARY,
    followsAccentHue: false,
  },
  BORDER_EMPHASIS: {
    foreground: '--border-emphasis',
    surfaces: FIELD_SURFACES,
    role: CONTRAST_ROLE.UI_BOUNDARY,
    followsAccentHue: false,
  },
  FIELD_BOUNDARY: {
    foreground: '--field-boundary',
    surfaces: FIELD_SURFACES,
    role: CONTRAST_ROLE.UI_BOUNDARY,
    followsAccentHue: false,
  },
  FIELD_BOUNDARY_TINTED: {
    foreground: '--field-boundary-tinted',
    surfaces: TINTED_FIELD_SURFACES,
    role: CONTRAST_ROLE.UI_BOUNDARY,
    followsAccentHue: true,
  },
  LOGO_TILE_CONTRAST: {
    foreground: '--logo-tile-contrast',
    surfaces: ['--logo-tile'],
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  ON_IMAGE: {
    foreground: '--on-image',
    surfaces: SCRIM_STOPS_UNDER_COPY,
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  RING: {
    foreground: '--ring',
    surfaces: BANDS,
    role: CONTRAST_ROLE.FOCUS,
    followsAccentHue: true,
  },
  ...ACCENT_TEXT_CONTRAST_PAIRS,
  ...ITEM_CONTRAST_PAIRS,
  ...HEADER_CONTRAST_PAIRS,
  BRAND_PRIMARY_ON_TINT: {
    foreground: BRAND_PRIMARY,
    surfaces: [BRAND_PRIMARY_MUTED],
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  ...CODE_CONTRAST_PAIRS,
  ...PRESET_ROLE_CONTRAST_PAIRS,
} as const satisfies Record<string, TContrastPair>;

export type TContrastPairId = keyof typeof CONTRAST_PAIRS;
