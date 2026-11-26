import {
  BORDER,
  BORDER_EMPHASIS,
  BRAND_PRIMARY,
  BRAND_PRIMARY_HOVER,
  BUTTON_FILL,
  BUTTON_FILL_HOVER,
  BUTTON_LABEL,
  DIVIDER,
  FIELD_BOUNDARY,
  HEADING_HIGHLIGHT,
  SURFACE,
  SURFACE_2,
} from './contrast-surfaces';
import { EYEBROW_CHIP, LINK_UNDERLINE } from './preset-role-tokens';
import type { TPresetSurfaceColors } from './preset-surface-types';
import { groundOf, inkOn, marksOf } from './shinefold-grounds';
import {
  INK,
  INK_RAISED,
  SLATE,
  TRANSPARENT,
  WHITE,
  YELLOW,
} from './shinefold-palette';

export const YELLOW_GROUND: TPresetSurfaceColors = {
  ...marksOf(INK, WHITE),
  ...groundOf(YELLOW),
  ...inkOn(SLATE),
  [SURFACE]: WHITE,
  [SURFACE_2]: WHITE,
  [BORDER]: INK,
  [DIVIDER]: INK,
  [BORDER_EMPHASIS]: SLATE,
  [FIELD_BOUNDARY]: SLATE,
  [BRAND_PRIMARY]: INK,
  [BRAND_PRIMARY_HOVER]: INK_RAISED,
  [LINK_UNDERLINE]: INK,
  [EYEBROW_CHIP]: TRANSPARENT,
  [HEADING_HIGHLIGHT]: INK,
  [BUTTON_FILL]: INK,
  [BUTTON_FILL_HOVER]: INK_RAISED,
  [BUTTON_LABEL]: WHITE,
};
