import {
  AMBIENT,
  AMBIENT_RAISED,
  BACKDROP,
  BORDER,
  DIVIDER,
  HEADING_HIGHLIGHT,
  SURFACE,
  TEXT,
  TEXT_MUTED,
  TEXT_SUBTLE,
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
  STANDALONE_LINK_UNDERLINE,
  TIER_BADGE_FILL,
  TIER_BADGE_LABEL,
  TIER_HIGHLIGHT_BORDER,
  TIMELINE_MARKER_FILL,
  TIMELINE_MARKER_NUMERAL,
} from './preset-role-tokens';
import type { TPresetSurfaceColors } from './preset-surface-types';
import {
  AMBER,
  BLOCK,
  BLOCK_LINE,
  CHIP_CREAM,
  HAIRLINE,
  INK,
  MIST,
  PAPER,
  SLATE,
  TRANSPARENT,
  WHITE,
  YELLOW,
} from './shinefold-palette';

export const groundOf = (color: string): TPresetSurfaceColors => ({
  [AMBIENT]: color,
  [BACKDROP]: color,
  [AMBIENT_RAISED]: color,
});

export const marksOf = (
  mark: string,
  onMark: string,
): TPresetSurfaceColors => ({
  [FEATURE_ICON_TILE]: YELLOW,
  [FEATURE_ICON_GLYPH]: INK,
  [TIER_HIGHLIGHT_BORDER]: mark,
  [TIER_BADGE_FILL]: mark,
  [TIER_BADGE_LABEL]: onMark,
  [TIMELINE_MARKER_FILL]: mark,
  [TIMELINE_MARKER_NUMERAL]: onMark,
  [ASIDE_BAR]: mark,
  [SIDENAV_CURRENT_BAR]: mark,
  [STANDALONE_LINK_UNDERLINE]: mark,
});

export const inkOn = (muted: string): TPresetSurfaceColors => ({
  [TEXT]: INK,
  [TEXT_MUTED]: muted,
  [TEXT_SUBTLE]: muted,
  [HEADING]: INK,
  [LINK_TEXT]: INK,
  [EYEBROW_TEXT]: INK,
  [SIDENAV_CURRENT_TEXT]: INK,
});

export const LIGHT_GROUND: TPresetSurfaceColors = {
  ...marksOf(YELLOW, INK),
  ...inkOn(SLATE),
  [SURFACE]: WHITE,
  [BORDER]: HAIRLINE,
  [DIVIDER]: HAIRLINE,
  [LINK_UNDERLINE]: YELLOW,
  [EYEBROW_CHIP]: CHIP_CREAM,
  [HEADING_HIGHLIGHT]: AMBER,
};

export const DARK_GROUND: TPresetSurfaceColors = {
  ...marksOf(YELLOW, INK),
  [TEXT]: PAPER,
  [TEXT_MUTED]: MIST,
  [TEXT_SUBTLE]: MIST,
  [HEADING]: WHITE,
  [SURFACE]: BLOCK,
  [BORDER]: BLOCK_LINE,
  [DIVIDER]: BLOCK_LINE,
  [LINK_TEXT]: YELLOW,
  [LINK_UNDERLINE]: YELLOW,
  [EYEBROW_TEXT]: YELLOW,
  [EYEBROW_CHIP]: TRANSPARENT,
  [SIDENAV_CURRENT_TEXT]: YELLOW,
  [HEADING_HIGHLIGHT]: YELLOW,
};

export const INK_GROUND: TPresetSurfaceColors = {
  ...DARK_GROUND,
  ...groundOf(INK),
};
