import { CONTRAST_ROLE } from '@shinefold/config/constants';

import type { TContrastPair } from './contrast-pairs';
import {
  BANDS,
  FILLED_ITEM_SURFACES,
  TEXT_SURFACES,
} from './contrast-surfaces';
import {
  EYEBROW_CHIP,
  EYEBROW_TEXT,
  FEATURE_ICON_GLYPH,
  FEATURE_ICON_TILE,
  HEADING,
  LINK_TEXT,
  SIDENAV_CURRENT_TEXT,
  TIER_BADGE_FILL,
  TIER_BADGE_LABEL,
  TIMELINE_MARKER_FILL,
  TIMELINE_MARKER_NUMERAL,
} from './preset-role-tokens';

export const PRESET_ROLE_CONTRAST_PAIRS = {
  HEADING: {
    foreground: HEADING,
    surfaces: TEXT_SURFACES,
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  LINK_TEXT: {
    foreground: LINK_TEXT,
    surfaces: FILLED_ITEM_SURFACES,
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  EYEBROW_TEXT: {
    foreground: EYEBROW_TEXT,
    surfaces: BANDS,
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  SIDENAV_CURRENT_TEXT: {
    foreground: SIDENAV_CURRENT_TEXT,
    surfaces: BANDS,
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  TIER_BADGE_LABEL: {
    foreground: TIER_BADGE_LABEL,
    surfaces: [TIER_BADGE_FILL],
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  TIMELINE_MARKER_NUMERAL: {
    foreground: TIMELINE_MARKER_NUMERAL,
    surfaces: [TIMELINE_MARKER_FILL],
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
} as const satisfies Record<string, TContrastPair>;

// The chip and the tile have no colour of their own until a preset sets one, so only a preset's own check measures them.
export const PRESET_FILL_CONTRAST_PAIRS = {
  EYEBROW_ON_CHIP: {
    foreground: EYEBROW_TEXT,
    surfaces: [EYEBROW_CHIP],
    role: CONTRAST_ROLE.TEXT,
    followsAccentHue: true,
  },
  FEATURE_ICON_ON_TILE: {
    foreground: FEATURE_ICON_GLYPH,
    surfaces: [FEATURE_ICON_TILE],
    role: CONTRAST_ROLE.UI_BOUNDARY,
    followsAccentHue: true,
  },
} as const satisfies Record<string, TContrastPair>;
