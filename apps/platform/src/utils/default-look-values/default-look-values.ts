import {
  LANGUAGE_SWITCHER_STYLE,
  PRESET_ID,
  PRESET_REGISTRY,
  type TBusyButtonStyle,
  type TCardStyle,
  type TDensity,
  type TFontChoice,
  type THeaderBarStyle,
  type THeaderControlStyle,
  type THeaderLayout,
  type THeaderSubmenuStyle,
  type TLanguageSwitcherStyle,
  type TMaybeUndefined,
  type TPresetId,
  type TSpinnerStyle,
  type TRadiusScale,
} from '@blog/config';
import type { TSiteConfigResult } from '@blog/db/queries/site-config';
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
  headerLayout: THeaderLayout;
  headerSubmenuStyle: THeaderSubmenuStyle;
  headerBarStyle: THeaderBarStyle;
  busyButtonStyle: TBusyButtonStyle;
  spinnerStyle: TSpinnerStyle;
  languageSwitcherStyle: TLanguageSwitcherStyle;
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
    headerLayout,
    headerSubmenuStyle,
    headerBarStyle,
    busyButtonStyle,
    spinnerStyle,
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
    headerLayout,
    headerSubmenuStyle,
    headerBarStyle,
    busyButtonStyle,
    spinnerStyle,
    languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.MENU_CODE,
    logo: { url: undefined },
    favicon: { url: undefined },
  };
};

export const toLookFormValues = (
  siteConfig: TSiteConfigResult,
): TLookFormValues => {
  return {
    preset: siteConfig.preset,
    accentHue: siteConfig.accentHue,
    logoHue: siteConfig.logoHue,
    headingFont: siteConfig.headingFont,
    bodyFont: siteConfig.bodyFont,
    radiusScale: siteConfig.radiusScale,
    density: siteConfig.density,
    cardStyle: siteConfig.cardStyle,
    headerControlStyle: siteConfig.headerControlStyle,
    headerLayout: siteConfig.headerLayout,
    headerSubmenuStyle: siteConfig.headerSubmenuStyle,
    headerBarStyle: siteConfig.headerBarStyle,
    busyButtonStyle: siteConfig.busyButtonStyle,
    spinnerStyle: siteConfig.spinnerStyle,
    languageSwitcherStyle: siteConfig.languageSwitcherStyle,
    logo: { url: siteConfig.logoAssetUrl },
    favicon: { url: siteConfig.faviconAssetUrl },
  };
};

export const lookFormValuesOrDefaults = (
  siteConfig: TMaybeUndefined<TSiteConfigResult>,
): TLookFormValues =>
  siteConfig ? toLookFormValues(siteConfig) : defaultLookFormValues();
