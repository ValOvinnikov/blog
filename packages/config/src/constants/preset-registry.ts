import { SPINNER_STYLE } from './busy-button';
import { CARD_STYLE } from './card-style';
import { CONSOLE_BUNDLE } from './console-preset-bundle';
import {
  DENSITY,
  FONT_CHOICE,
  PRESET_ID,
  RADIUS_SCALE,
  type TPresetBundle,
  type TPresetId,
} from './preset';
import { SHINEFOLD_BUNDLE } from './shinefold-preset-bundle';

export const PRESET_REGISTRY: Record<TPresetId, TPresetBundle> = {
  [PRESET_ID.CONSOLE]: CONSOLE_BUNDLE,
  [PRESET_ID.EDITORIAL]: {
    ...CONSOLE_BUNDLE,
    themeTokens: {
      accentHue: 28,
      headingFont: FONT_CHOICE.FRAUNCES,
      bodyFont: FONT_CHOICE.INTER,
      radiusScale: RADIUS_SCALE.SM,
      density: DENSITY.COMPACT,
    },
    cardStyle: CARD_STYLE.OUTLINED,
    spinnerStyle: SPINNER_STYLE.RING,
  },
  [PRESET_ID.SHINEFOLD]: SHINEFOLD_BUNDLE,
};
