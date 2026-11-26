import type { TStagedImage } from '@platform/utils/staged-image/staged-image';
import {
  COLOR_MODE,
  LANGUAGE_SWITCHER_STYLE,
  PRESET_ID,
  type TAccountButtonStyle,
  type TAccountPanelStyle,
  type TAccountPhonePlacement,
  type TBrandVariant,
  type TBusyButtonStyle,
  type TButtonShape,
  type TCardStyle,
  type TColorMode,
  type TCookieSettingsButton,
  type TDensity,
  type TDividerWidth,
  type TFontChoice,
  type TFooterLayout,
  type TFooterSurface,
  type THeaderBarStyle,
  type THeaderControlShape,
  type THeaderControlStyle,
  type THeaderLayout,
  type THeaderSubmenuStyle,
  type THeadingCase,
  type THeadingWeight,
  type TImageProportion,
  type TLanguageSwitcherStyle,
  type TMaybeUndefined,
  type TNavLinkStyle,
  type TPresetId,
  type TSpinnerStyle,
  type TRadiusScale,
} from '@shinefold/config';
import { presetSiteConfig } from '@shinefold/db/utils/preset-site-config/preset-site-config';

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
  headerBackground: TBrandVariant;
  breadcrumbBackground: TBrandVariant;
  navLinkStyle: TNavLinkStyle;
  headingWeight: THeadingWeight;
  headingCase: THeadingCase;
  imageProportion: TImageProportion;
  dividerWidth: TDividerWidth;
  colorMode: TColorMode;
  accountButtonStyle: TAccountButtonStyle;
  accountPanelStyle: TAccountPanelStyle;
  accountPhonePlacement: TAccountPhonePlacement;
  busyButtonStyle: TBusyButtonStyle;
  spinnerStyle: TSpinnerStyle;
  buttonShape: TButtonShape;
  buttonColor: TMaybeUndefined<string>;
  buttonColorDark: TMaybeUndefined<string>;
  footerLayout: TFooterLayout;
  footerBackground: TBrandVariant;
  footerSurface: TFooterSurface;
  cookieSettingsButton: TCookieSettingsButton;
  languageSwitcherStyle: TLanguageSwitcherStyle;
  brandName: string;
  logo: TStagedImage;
  logoDark: TStagedImage;
  favicon: TStagedImage;
};

export type TLookFormFieldSetter = <K extends keyof TLookFormValues>(
  key: K,
  value: TLookFormValues[K],
) => void;

/** The Console defaults `build-theme-style-block.ts` also falls back to before any theme is saved. */
export const defaultLookFormValues = (): TLookFormValues => ({
  ...presetSiteConfig(PRESET_ID.CONSOLE),
  logoHue: undefined,
  buttonColor: undefined,
  buttonColorDark: undefined,
  languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.MENU_CODE,
  colorMode: COLOR_MODE.READER,
  brandName: '',
  logo: { url: undefined },
  logoDark: { url: undefined },
  favicon: { url: undefined },
});
