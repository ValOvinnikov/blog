import { SHINEFOLD_YELLOW } from '@shinefold/config/constants';

import {
  AMBIENT,
  AMBIENT_RAISED,
  BORDER,
  BORDER_EMPHASIS,
  BRAND_PRIMARY,
  BUTTON_FILL,
  BUTTON_FILL_HOVER,
  BUTTON_LABEL,
  FIELD_BOUNDARY,
  SURFACE,
  SURFACE_2,
  TEXT,
  TEXT_MUTED,
} from './contrast-surfaces';
import {
  ASIDE_BAR,
  EYEBROW_CHIP,
  EYEBROW_TEXT,
  FEATURE_ICON_GLYPH,
  FEATURE_ICON_TILE,
  HEADING,
  LINK_TEXT,
  LINK_UNDERLINE,
  SIDENAV_CURRENT_BAR,
  SIDENAV_CURRENT_TEXT,
  TIER_BADGE_FILL,
  TIER_BADGE_LABEL,
  TIER_HIGHLIGHT_BORDER,
  TIMELINE_MARKER_FILL,
  TIMELINE_MARKER_NUMERAL,
} from './preset-role-tokens';
import type { TPresetSurfaceColors } from './preset-surface-types';

export const WHITE = '#ffffff';
export const INK = '#12141a';
const INK_RAISED = '#2a2d36';
const SLATE = '#4b5058';
const HAIRLINE = '#dfe1e6';
export const CREAM = '#fff6dd';
const CHIP_CREAM = '#fff3cf';
const PAPER = '#e8eaef';
const MIST = '#a9afba';
export const NAVY = '#0e1726';
const NAVY_LINE = '#232b3d';
const TRANSPARENT = 'transparent';

export const groundOf = (color: string): TPresetSurfaceColors => ({
  [AMBIENT]: color,
  '--backdrop': color,
  [AMBIENT_RAISED]: color,
});

const YELLOW_MARKS: TPresetSurfaceColors = {
  [FEATURE_ICON_TILE]: SHINEFOLD_YELLOW,
  [FEATURE_ICON_GLYPH]: INK,
  [TIER_HIGHLIGHT_BORDER]: SHINEFOLD_YELLOW,
  [TIER_BADGE_FILL]: SHINEFOLD_YELLOW,
  [TIER_BADGE_LABEL]: INK,
  [TIMELINE_MARKER_FILL]: SHINEFOLD_YELLOW,
  [TIMELINE_MARKER_NUMERAL]: INK,
  [ASIDE_BAR]: SHINEFOLD_YELLOW,
  [SIDENAV_CURRENT_BAR]: SHINEFOLD_YELLOW,
};

const inkOn = (muted: string): TPresetSurfaceColors => ({
  [TEXT]: INK,
  [TEXT_MUTED]: muted,
  '--text-subtle': muted,
  [HEADING]: INK,
  [LINK_TEXT]: INK,
  [EYEBROW_TEXT]: INK,
  [SIDENAV_CURRENT_TEXT]: INK,
});

export const LIGHT_GROUND: TPresetSurfaceColors = {
  ...YELLOW_MARKS,
  ...inkOn(SLATE),
  [SURFACE]: WHITE,
  [BORDER]: HAIRLINE,
  '--divider': HAIRLINE,
  [LINK_UNDERLINE]: SHINEFOLD_YELLOW,
  [EYEBROW_CHIP]: CHIP_CREAM,
};

export const DARK_GROUND: TPresetSurfaceColors = {
  ...YELLOW_MARKS,
  [TEXT]: PAPER,
  [TEXT_MUTED]: MIST,
  '--text-subtle': MIST,
  [HEADING]: WHITE,
  [SURFACE]: NAVY,
  [BORDER]: NAVY_LINE,
  '--divider': NAVY_LINE,
  [LINK_TEXT]: SHINEFOLD_YELLOW,
  [LINK_UNDERLINE]: SHINEFOLD_YELLOW,
  [EYEBROW_TEXT]: SHINEFOLD_YELLOW,
  [EYEBROW_CHIP]: TRANSPARENT,
  [SIDENAV_CURRENT_TEXT]: SHINEFOLD_YELLOW,
};

export const YELLOW_GROUND: TPresetSurfaceColors = {
  ...YELLOW_MARKS,
  ...groundOf(SHINEFOLD_YELLOW),
  ...inkOn(SLATE),
  [SURFACE]: WHITE,
  [SURFACE_2]: WHITE,
  [BORDER]: INK,
  '--divider': INK,
  [BORDER_EMPHASIS]: SLATE,
  [FIELD_BOUNDARY]: SLATE,
  [BRAND_PRIMARY]: INK,
  '--brand-primary-hover': INK_RAISED,
  [LINK_UNDERLINE]: INK,
  [EYEBROW_CHIP]: TRANSPARENT,
  [TIER_HIGHLIGHT_BORDER]: INK,
  [ASIDE_BAR]: INK,
  [SIDENAV_CURRENT_BAR]: INK,
  [BUTTON_FILL]: INK,
  [BUTTON_FILL_HOVER]: INK_RAISED,
  [BUTTON_LABEL]: WHITE,
};

export const INK_GROUND: TPresetSurfaceColors = {
  ...DARK_GROUND,
  ...groundOf(INK),
};
