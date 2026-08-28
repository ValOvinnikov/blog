import {
  PRESET_ID,
  PRESET_REGISTRY,
  type TDensity,
  type TFontChoice,
  type TPresetId,
  type TRadiusScale,
} from '@blog/config';
import type { TSiteConfigResult } from '@blog/db/queries/site-config';

export type TLookFormValues = {
  preset: TPresetId;
  accentHue: number;
  /** `undefined` means "follows the accent hue" — a real, saved value here is what makes the wordmark's tint independent. */
  logoHue: number | undefined;
  headingFont: TFontChoice;
  bodyFont: TFontChoice;
  radiusScale: TRadiusScale;
  density: TDensity;
  /** Preview-only: `site_config` has no persisted column for this field yet. */
  chromeOn: boolean;
  logoAssetUrl: string | undefined;
  faviconAssetUrl: string | undefined;
};

/**
 * The starting values for a tenant with no `site_config` row yet — the same
 * Console defaults `build-theme-style-block.ts` falls back to when no theme
 * has been saved.
 */
export const defaultLookFormValues = (): TLookFormValues => {
  const consoleTokens = PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens;

  return {
    preset: PRESET_ID.CONSOLE,
    accentHue: consoleTokens.accentHue,
    logoHue: undefined,
    headingFont: consoleTokens.headingFont,
    bodyFont: consoleTokens.bodyFont,
    radiusScale: consoleTokens.radiusScale,
    density: consoleTokens.density,
    chromeOn: consoleTokens.chromeOn,
    logoAssetUrl: undefined,
    faviconAssetUrl: undefined,
  };
};

/**
 * `chromeOn` has no column on `site_config` — every load derives it fresh
 * from the saved preset's registry default rather than reading a stored
 * value, since none exists.
 */
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
    chromeOn: PRESET_REGISTRY[siteConfig.preset].themeTokens.chromeOn,
    logoAssetUrl: siteConfig.logoAssetUrl,
    faviconAssetUrl: siteConfig.faviconAssetUrl,
  };
};
