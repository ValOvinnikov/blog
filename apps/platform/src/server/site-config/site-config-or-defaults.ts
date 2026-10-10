import 'server-only';

import type {
  TDensity,
  TFontChoice,
  TPresetId,
  TRadiusScale,
} from '@blog/config';
import { queries } from '@blog/db';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';

export type TSiteConfigThemeAndAssets = {
  preset: TPresetId;
  accentHue: number;
  headingFont: TFontChoice;
  bodyFont: TFontChoice;
  radiusScale: TRadiusScale;
  density: TDensity;
  logoAssetUrl: string | undefined;
  faviconAssetUrl: string | undefined;
};

export const getSiteConfigOrDefaults = async (
  tenantId: string,
): Promise<TSiteConfigThemeAndAssets> => {
  const siteConfig = await queries.siteConfig.getSiteConfig(tenantId);
  if (siteConfig) {
    return {
      preset: siteConfig.preset,
      accentHue: siteConfig.accentHue,
      headingFont: siteConfig.headingFont,
      bodyFont: siteConfig.bodyFont,
      radiusScale: siteConfig.radiusScale,
      density: siteConfig.density,
      logoAssetUrl: siteConfig.logoAssetUrl,
      faviconAssetUrl: siteConfig.faviconAssetUrl,
    };
  }

  const defaults = defaultLookFormValues();

  return {
    preset: defaults.preset,
    accentHue: defaults.accentHue,
    headingFont: defaults.headingFont,
    bodyFont: defaults.bodyFont,
    radiusScale: defaults.radiusScale,
    density: defaults.density,
    logoAssetUrl: undefined,
    faviconAssetUrl: undefined,
  };
};
