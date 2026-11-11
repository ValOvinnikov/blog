import {
  LANGUAGE_SWITCHER_STYLE,
  PRESET_ID,
  PRESET_REGISTRY,
  type TAccountButtonStyle,
  type TAccountPanelStyle,
  type TAccountPhonePlacement,
  type TBrandVariant,
  type TBusyButtonStyle,
  type TButtonShape,
  type TCardStyle,
  type TCookieSettingsButton,
  type TDensity,
  type TFontChoice,
  type TFooterLayout,
  type TFooterSurface,
  type THeaderBarStyle,
  type THeaderControlShape,
  type THeaderControlStyle,
  type THeaderLayout,
  type THeaderSubmenuStyle,
  type TLanguageSwitcherStyle,
  type TMaybeUndefined,
  type TNavLinkStyle,
  type TPresetId,
  type TSpinnerStyle,
  type TRadiusScale,
} from '@blog/config';
import type { TStagedImage } from '@platform/utils/staged-image/staged-image';

export type TLookFormValues = {
  preset: TPresetId;
  accentHue: number;
  logoHue: TMaybeUndefined<number>;
  headingFont: TFontChoice;
  bodyFont: TFontChoice;
  radiusScale: TRadiusScale;
  density: TDensity;
  cardStyle: TCardStyle;
  headerControlStyle: THeaderControlStyle;
  headerControlShape: THeaderControlShape;
  headerLayout: THeaderLayout;
  headerSubmenuStyle: THeaderSubmenuStyle;
  headerBarStyle: THeaderBarStyle;
  navLinkStyle: TNavLinkStyle;
  accountButtonStyle: TAccountButtonStyle;
  accountPanelStyle: TAccountPanelStyle;
  accountPhonePlacement: TAccountPhonePlacement;
  busyButtonStyle: TBusyButtonStyle;
  spinnerStyle: TSpinnerStyle;
  buttonShape: TButtonShape;
  footerLayout: TFooterLayout;
  footerBackground: TBrandVariant;
  footerSurface: TFooterSurface;
  cookieSettingsButton: TCookieSettingsButton;
  languageSwitcherStyle: TLanguageSwitcherStyle;
  brandName: string;
  logo: TStagedImage;
  favicon: TStagedImage;
};

export type TLookFormFieldSetter = <K extends keyof TLookFormValues>(
  key: K,
  value: TLookFormValues[K],
) => void;

/** The Console defaults `build-theme-style-block.ts` also falls back to before any theme is saved. */
export const defaultLookFormValues = (): TLookFormValues => {
  const {
    themeTokens: consoleTokens,
    cardStyle,
    headerControlStyle,
    headerControlShape,
    headerLayout,
    headerSubmenuStyle,
    headerBarStyle,
    navLinkStyle,
    accountButtonStyle,
    accountPanelStyle,
    accountPhonePlacement,
    busyButtonStyle,
    spinnerStyle,
    buttonShape,
    footerLayout,
    footerBackground,
    footerSurface,
    cookieSettingsButton,
  } = PRESET_REGISTRY[PRESET_ID.CONSOLE];

  return {
    preset: PRESET_ID.CONSOLE,
    accentHue: consoleTokens.accentHue,
    logoHue: undefined,
    headingFont: consoleTokens.headingFont,
    bodyFont: consoleTokens.bodyFont,
    radiusScale: consoleTokens.radiusScale,
    density: consoleTokens.density,
    cardStyle,
    headerControlStyle,
    headerControlShape,
    headerLayout,
    headerSubmenuStyle,
    headerBarStyle,
    navLinkStyle,
    accountButtonStyle,
    accountPanelStyle,
    accountPhonePlacement,
    busyButtonStyle,
    spinnerStyle,
    buttonShape,
    footerLayout,
    footerBackground,
    footerSurface,
    cookieSettingsButton,
    languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.MENU_CODE,
    brandName: '',
    logo: { url: undefined },
    favicon: { url: undefined },
  };
};
