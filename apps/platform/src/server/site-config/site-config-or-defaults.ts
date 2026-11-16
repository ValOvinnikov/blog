import 'server-only';

import { lookFormValuesOrDefaults } from '@platform/utils/to-look-form-values/to-look-form-values';
import type {
  TDensity,
  TFontChoice,
  TMaybeUndefined,
  TPresetId,
  TRadiusScale,
} from '@shinefold/config';
import { queries } from '@shinefold/db';

export type TSiteConfigThemeAndAssets = {
  preset: TPresetId;
  accentHue: number;
  headingFont: TFontChoice;
  bodyFont: TFontChoice;
  radiusScale: TRadiusScale;
  density: TDensity;
  logoAssetUrl: TMaybeUndefined<string>;
  faviconAssetUrl: TMaybeUndefined<string>;
};

export const getSiteConfigOrDefaults = async (
  tenantId: string,
): Promise<TSiteConfigThemeAndAssets> => {
  const {
    preset,
    accentHue,
    headingFont,
    bodyFont,
    radiusScale,
    density,
    logo,
    favicon,
  } = lookFormValuesOrDefaults(
    await queries.siteConfig.getSiteConfig(tenantId),
  );

  return {
    preset,
    accentHue,
    headingFont,
    bodyFont,
    radiusScale,
    density,
    logoAssetUrl: logo.url,
    faviconAssetUrl: favicon.url,
  };
};
