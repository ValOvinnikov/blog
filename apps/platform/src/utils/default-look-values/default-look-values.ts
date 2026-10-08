import {
  LANGUAGE_SWITCHER_STYLE,
  PRESET_ID,
  PRESET_REGISTRY,
  type TCardStyle,
  type TDensity,
  type TFontChoice,
  type TLanguageSwitcherStyle,
  type TPresetId,
  type TRadiusScale,
} from '@blog/config';
import type { TSiteConfigResult } from '@blog/db/queries/site-config';
import type { TStagedImage } from '@platform/utils/staged-image/staged-image';

export type TLookFormValues = {
  preset: TPresetId;
  accentHue: number;
  logoHue: number | undefined;
  headingFont: TFontChoice;
  bodyFont: TFontChoice;
  radiusScale: TRadiusScale;
  density: TDensity;
  cardStyle: TCardStyle;
  languageSwitcherStyle: TLanguageSwitcherStyle;
  logo: TStagedImage;
  favicon: TStagedImage;
};

export type TLookFormFieldSetter = <K extends keyof TLookFormValues>(
  key: K,
  value: TLookFormValues[K],
) => void;

/**
 * The starting values for a tenant with no `site_config` row yet — the same
 * Console defaults `build-theme-style-block.ts` falls back to when no theme
 * has been saved.
 */
export const defaultLookFormValues = (): TLookFormValues => {
  const { themeTokens: consoleTokens, cardStyle } =
    PRESET_REGISTRY[PRESET_ID.CONSOLE];

  return {
    preset: PRESET_ID.CONSOLE,
    accentHue: consoleTokens.accentHue,
    logoHue: undefined,
    headingFont: consoleTokens.headingFont,
    bodyFont: consoleTokens.bodyFont,
    radiusScale: consoleTokens.radiusScale,
    density: consoleTokens.density,
    cardStyle,
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
    languageSwitcherStyle: siteConfig.languageSwitcherStyle,
    logo: { url: siteConfig.logoAssetUrl },
    favicon: { url: siteConfig.faviconAssetUrl },
  };
};
