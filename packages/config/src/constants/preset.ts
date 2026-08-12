import type { TValueOf } from '@blog/config/utils';

import {
  CONSOLE_VOICE_PACK,
  EDITORIAL_VOICE_PACK,
  type TVoicePack,
} from './voice-pack';

export const PRESET_ID = {
  CONSOLE: 'CONSOLE',
  EDITORIAL: 'EDITORIAL',
} as const;

export type TPresetId = TValueOf<typeof PRESET_ID>;

export const FONT_CHOICE = {
  SPACE_GROTESK: 'SPACE_GROTESK',
  NEWSREADER: 'NEWSREADER',
  JETBRAINS_MONO: 'JETBRAINS_MONO',
  FRAUNCES: 'FRAUNCES',
  INTER: 'INTER',
} as const;

export type TFontChoice = TValueOf<typeof FONT_CHOICE>;

export const RADIUS_SCALE = {
  SM: 'SM',
  MD: 'MD',
  LG: 'LG',
  XL: 'XL',
} as const;

export type TRadiusScale = TValueOf<typeof RADIUS_SCALE>;

export const RADIUS_SCALE_LABEL: Record<TRadiusScale, string> = {
  [RADIUS_SCALE.SM]: 'Small',
  [RADIUS_SCALE.MD]: 'Medium',
  [RADIUS_SCALE.LG]: 'Large',
  [RADIUS_SCALE.XL]: 'Extra Large',
};

export const DENSITY = {
  DEFAULT: 'DEFAULT',
  COMPACT: 'COMPACT',
} as const;

export type TDensity = TValueOf<typeof DENSITY>;

export type TThemeTokens = {
  accentHue: number; // OKLCH hue channel driving --brand-primary*
  logoHue?: number; // OKLCH hue channel for --logo-1/2/3 only; defaults to accentHue when unset
  headingFont: TFontChoice;
  bodyFont: TFontChoice;
  radiusScale: TRadiusScale;
  density: TDensity;
  chromeOn: boolean;
};

export type TPresetBundle = {
  themeTokens: TThemeTokens;
  voicePack: TVoicePack;
  featureDefaults: Record<string, never>;
};

export const PRESET_REGISTRY: Record<TPresetId, TPresetBundle> = {
  [PRESET_ID.CONSOLE]: {
    themeTokens: {
      accentHue: 250,
      headingFont: FONT_CHOICE.SPACE_GROTESK,
      bodyFont: FONT_CHOICE.NEWSREADER,
      radiusScale: RADIUS_SCALE.MD,
      density: DENSITY.DEFAULT,
      chromeOn: true,
    },
    voicePack: CONSOLE_VOICE_PACK,
    featureDefaults: {},
  },
  [PRESET_ID.EDITORIAL]: {
    themeTokens: {
      accentHue: 28,
      headingFont: FONT_CHOICE.FRAUNCES,
      bodyFont: FONT_CHOICE.INTER,
      radiusScale: RADIUS_SCALE.SM,
      density: DENSITY.COMPACT,
      chromeOn: false,
    },
    voicePack: EDITORIAL_VOICE_PACK,
    featureDefaults: {},
  },
};
