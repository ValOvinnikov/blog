import 'server-only';

import type {
  TDensity,
  TFontChoice,
  TMaybeUndefined,
  TPresetId,
  TRadiusScale,
} from '@blog/config';
import { queries } from '@blog/db';
import { lookFormValuesOrDefaults } from '@platform/utils/default-look-values/default-look-values';

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
