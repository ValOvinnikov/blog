import type { TValueOf } from '@blog/config/utils';

import {
  ACCOUNT_BUTTON_STYLE,
  ACCOUNT_PANEL_STYLE,
  ACCOUNT_PHONE_PLACEMENT,
  type TAccountButtonStyle,
  type TAccountPanelStyle,
  type TAccountPhonePlacement,
} from './account-control';
import {
  BUSY_BUTTON_STYLE,
  SPINNER_STYLE,
  type TBusyButtonStyle,
  type TSpinnerStyle,
} from './busy-button';
import { type TCapability, CAPABILITY } from './capability';
import { type TCardStyle, CARD_STYLE } from './card-style';
import {
  type THeaderControlStyle,
  HEADER_CONTROL_STYLE,
} from './header-control-style';

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

export const LANGUAGE_SWITCHER_STYLE = {
  MENU_CODE: 'MENU_CODE',
  MENU_GLOBE: 'MENU_GLOBE',
  CODES: 'CODES',
} as const;

export type TLanguageSwitcherStyle = TValueOf<typeof LANGUAGE_SWITCHER_STYLE>;

export const HUE_MIN = 0;
export const HUE_MAX = 360;

export type TThemeTokens = {
  accentHue: number;
  logoHue?: number;
  headingFont: TFontChoice;
  bodyFont: TFontChoice;
  radiusScale: TRadiusScale;
  density: TDensity;
  cardStyle?: TCardStyle;
  headerControlStyle?: THeaderControlStyle;
};

export type TPresetBundle = {
  themeTokens: TThemeTokens;
  cardStyle: TCardStyle;
  headerControlStyle: THeaderControlStyle;
  accountButtonStyle: TAccountButtonStyle;
  accountPanelStyle: TAccountPanelStyle;
  accountPhonePlacement: TAccountPhonePlacement;
  busyButtonStyle: TBusyButtonStyle;
  spinnerStyle: TSpinnerStyle;
  featureDefaults: Record<TCapability, boolean>;
};

export const PRESET_REGISTRY: Record<TPresetId, TPresetBundle> = {
  [PRESET_ID.CONSOLE]: {
    themeTokens: {
      accentHue: 250,
      headingFont: FONT_CHOICE.SPACE_GROTESK,
      bodyFont: FONT_CHOICE.NEWSREADER,
      radiusScale: RADIUS_SCALE.MD,
      density: DENSITY.DEFAULT,
    },
    cardStyle: CARD_STYLE.ACCENT_BAR,
    headerControlStyle: HEADER_CONTROL_STYLE.OUTLINED,
    accountButtonStyle: ACCOUNT_BUTTON_STYLE.PILL,
    accountPanelStyle: ACCOUNT_PANEL_STYLE.CARD,
    accountPhonePlacement: ACCOUNT_PHONE_PLACEMENT.BAR,
    busyButtonStyle: BUSY_BUTTON_STYLE.LABEL,
    spinnerStyle: SPINNER_STYLE.PRESET,
    featureDefaults: {
      [CAPABILITY.COMMENTS]: true,
      [CAPABILITY.RATINGS]: true,
      [CAPABILITY.BOOKMARKS]: true,
      [CAPABILITY.NEWSLETTER]: false,
      [CAPABILITY.ANALYTICS]: false,
      [CAPABILITY.CONSENT_BANNER]: false,
      [CAPABILITY.CONTACT_FORM]: true,
    },
  },
  [PRESET_ID.EDITORIAL]: {
    themeTokens: {
      accentHue: 28,
      headingFont: FONT_CHOICE.FRAUNCES,
      bodyFont: FONT_CHOICE.INTER,
      radiusScale: RADIUS_SCALE.SM,
      density: DENSITY.COMPACT,
    },
    cardStyle: CARD_STYLE.OUTLINED,
    headerControlStyle: HEADER_CONTROL_STYLE.OUTLINED,
    accountButtonStyle: ACCOUNT_BUTTON_STYLE.PILL,
    accountPanelStyle: ACCOUNT_PANEL_STYLE.CARD,
    accountPhonePlacement: ACCOUNT_PHONE_PLACEMENT.BAR,
    busyButtonStyle: BUSY_BUTTON_STYLE.LABEL,
    spinnerStyle: SPINNER_STYLE.PRESET,
    featureDefaults: {
      [CAPABILITY.COMMENTS]: true,
      [CAPABILITY.RATINGS]: true,
      [CAPABILITY.BOOKMARKS]: true,
      [CAPABILITY.NEWSLETTER]: false,
      [CAPABILITY.ANALYTICS]: false,
      [CAPABILITY.CONSENT_BANNER]: false,
      [CAPABILITY.CONTACT_FORM]: true,
    },
  },
};
