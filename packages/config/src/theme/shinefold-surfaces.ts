import {
  BRAND_VARIANT,
  COLOR_SCHEME,
  type TColorScheme,
} from '@shinefold/config/constants';

import { PRIMARY, SECONDARY } from './contrast-surfaces';
import {
  BAND_EDGE,
  LINK_UNDERLINE_WIDTH,
  LINK_UNDERLINE_WIDTH_HOVER,
  TIER_HIGHLIGHT_BORDER_WIDTH,
} from './preset-role-tokens';
import type {
  TPresetBandSurface,
  TPresetSurfaceColors,
  TPresetSurfaces,
} from './preset-surface-types';
import {
  DARK_GROUND,
  groundOf,
  INK_GROUND,
  LIGHT_GROUND,
} from './shinefold-grounds';
import {
  BLOCK,
  BLOCK_LINE,
  CREAM,
  INK,
  INK_RAISED,
  TRANSPARENT,
  WHITE,
} from './shinefold-palette';
import { YELLOW_GROUND } from './shinefold-yellow-ground';

const drawnAs = (
  base: TColorScheme,
  colors: TPresetSurfaceColors,
  edge = TRANSPARENT,
): TPresetBandSurface => ({ base, colors: { ...colors, [BAND_EDGE]: edge } });

const LIGHT_PAGE: TPresetSurfaceColors = {
  ...LIGHT_GROUND,
  [PRIMARY]: WHITE,
  [SECONDARY]: CREAM,
};

const DARK_PAGE: TPresetSurfaceColors = {
  ...DARK_GROUND,
  [PRIMARY]: INK,
  [SECONDARY]: BLOCK,
};

const LIGHT = COLOR_SCHEME.LIGHT;
const DARK = COLOR_SCHEME.DARK;

export const SHINEFOLD_SURFACES: TPresetSurfaces = {
  page: { [LIGHT]: LIGHT_PAGE, [DARK]: DARK_PAGE },
  bands: {
    [BRAND_VARIANT.PRIMARY]: {
      [LIGHT]: drawnAs(LIGHT, { ...LIGHT_GROUND, ...groundOf(WHITE) }),
      [DARK]: drawnAs(DARK, { ...DARK_GROUND, ...groundOf(INK) }),
    },
    [BRAND_VARIANT.SECONDARY]: {
      [LIGHT]: drawnAs(LIGHT, { ...LIGHT_GROUND, ...groundOf(CREAM) }),
      [DARK]: drawnAs(DARK, { ...DARK_GROUND, ...groundOf(BLOCK) }, BLOCK_LINE),
    },
    [BRAND_VARIANT.BRAND_PRIMARY]: {
      [LIGHT]: drawnAs(LIGHT, YELLOW_GROUND),
      [DARK]: drawnAs(LIGHT, YELLOW_GROUND),
    },
    [BRAND_VARIANT.INK]: {
      [LIGHT]: drawnAs(DARK, INK_GROUND),
      [DARK]: drawnAs(DARK, INK_GROUND, INK_RAISED),
    },
  },
  lengths: {
    [LIGHT]: {
      [LINK_UNDERLINE_WIDTH]: '3px',
      [LINK_UNDERLINE_WIDTH_HOVER]: '4px',
      [TIER_HIGHLIGHT_BORDER_WIDTH]: '2px',
    },
    [DARK]: {
      [LINK_UNDERLINE_WIDTH]: '1.5px',
      [LINK_UNDERLINE_WIDTH_HOVER]: '2.5px',
      [TIER_HIGHLIGHT_BORDER_WIDTH]: '2px',
    },
  },
};
