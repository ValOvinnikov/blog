import { isOneOf } from '@shinefold/utils/primitives';

import type { TValueOf } from '@shinefold/config/utils';

import type {
  TAccountButtonStyle,
  TAccountPanelStyle,
  TAccountPhonePlacement,
} from './account-control';
import type { TBusyButtonStyle, TSpinnerStyle } from './busy-button';
import type { TButtonShape } from './button-shape';
import type { TCapability } from './capability';
import type { TCardStyle } from './card-style';
import type { TDividerWidth } from './divider-width';
import type {
  TCookieSettingsButton,
  TFooterLayout,
  TFooterSurface,
} from './footer-layout';
import type {
  THeaderActionPhonePlacement,
  THeaderActionStyle,
} from './header-action';
import type { THeaderControlShape } from './header-control-shape';
import type { THeaderControlStyle } from './header-control-style';
import type {
  THeaderBarStyle,
  THeaderLayout,
  THeaderSubmenuStyle,
} from './header-layout';
import type { THeadingCase, THeadingWeight } from './heading-style';
import type { TImageProportion } from './image-proportion';
import type { TBrandVariant } from './layout';
import type { TNavLinkStyle } from './nav-link-style';
import type { TThemeTokens } from './theme-tokens';

export const PRESET_ID = {
  CONSOLE: 'CONSOLE',
  EDITORIAL: 'EDITORIAL',
  SHINEFOLD: 'SHINEFOLD',
} as const;

export type TPresetId = TValueOf<typeof PRESET_ID>;

export const OPEN_PRESET_IDS = [
  PRESET_ID.CONSOLE,
  PRESET_ID.EDITORIAL,
] as const satisfies readonly TPresetId[];

export type TOpenPresetId = (typeof OPEN_PRESET_IDS)[number];

export type TGrantablePresetId = Exclude<TPresetId, TOpenPresetId>;

export const GRANTABLE_PRESET_IDS = Object.values(PRESET_ID).filter(
  (id): id is TGrantablePresetId => !isOneOf(OPEN_PRESET_IDS, id),
);

export const FONT_CHOICE = {
  SPACE_GROTESK: 'SPACE_GROTESK',
  NEWSREADER: 'NEWSREADER',
  JETBRAINS_MONO: 'JETBRAINS_MONO',
  FRAUNCES: 'FRAUNCES',
  INTER: 'INTER',
} as const;

export type TFontChoice = TValueOf<typeof FONT_CHOICE>;

export const RADIUS_SCALE = {
  NONE: 'NONE',
  SM: 'SM',
  MD: 'MD',
  LG: 'LG',
  XL: 'XL',
} as const;

export type TRadiusScale = TValueOf<typeof RADIUS_SCALE>;

export const RADIUS_SCALE_LABEL: Record<TRadiusScale, string> = {
  [RADIUS_SCALE.NONE]: 'None',
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

export type TPresetBundle = {
  themeTokens: TThemeTokens;
  cardStyle: TCardStyle;
  headerControlStyle: THeaderControlStyle;
  headerControlShape: THeaderControlShape;
  headerActionStyle: THeaderActionStyle;
  headerActionPhonePlacement: THeaderActionPhonePlacement;
  accountButtonStyle: TAccountButtonStyle;
  accountPanelStyle: TAccountPanelStyle;
  accountPhonePlacement: TAccountPhonePlacement;
  busyButtonStyle: TBusyButtonStyle;
  spinnerStyle: TSpinnerStyle;
  buttonShape: TButtonShape;
  headerLayout: THeaderLayout;
  headerSubmenuStyle: THeaderSubmenuStyle;
  headerBarStyle: THeaderBarStyle;
  headerBackground: TBrandVariant;
  breadcrumbBackground: TBrandVariant;
  navLinkStyle: TNavLinkStyle;
  headingWeight: THeadingWeight;
  headingCase: THeadingCase;
  imageProportion: TImageProportion;
  dividerWidth: TDividerWidth;
  footerLayout: TFooterLayout;
  footerBackground: TBrandVariant;
  footerSurface: TFooterSurface;
  cookieSettingsButton: TCookieSettingsButton;
  featureDefaults: Record<TCapability, boolean>;
};
