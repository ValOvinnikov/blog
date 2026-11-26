import { SHINEFOLD_LOGO_COLOR } from '@shinefold/utils/shinefold-logo';

import { BUTTON_SHAPE } from './button-shape';
import { CARD_STYLE } from './card-style';
import { CONSOLE_BUNDLE } from './console-preset-bundle';
import { FOOTER_LAYOUT, FOOTER_SURFACE } from './footer-layout';
import { BRAND_VARIANT } from './layout';
import {
  DENSITY,
  FONT_CHOICE,
  RADIUS_SCALE,
  type TPresetBundle,
} from './preset';

export const SHINEFOLD_BUNDLE: TPresetBundle = {
  ...CONSOLE_BUNDLE,
  themeTokens: {
    accentHue: 83,
    headingFont: FONT_CHOICE.SPACE_GROTESK,
    bodyFont: FONT_CHOICE.INTER,
    radiusScale: RADIUS_SCALE.XL,
    density: DENSITY.DEFAULT,
  },
  cardStyle: CARD_STYLE.OUTLINED,
  buttonShape: BUTTON_SHAPE.PILL,
  buttonColor: SHINEFOLD_LOGO_COLOR.YELLOW,
  footerLayout: FOOTER_LAYOUT.COLUMNS,
  footerBackground: BRAND_VARIANT.INK,
  footerSurface: FOOTER_SURFACE.FULL_WIDTH,
};
