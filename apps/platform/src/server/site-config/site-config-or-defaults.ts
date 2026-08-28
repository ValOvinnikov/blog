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

/**
 * Shared by the brand-asset upload/clear actions: both need every theme
 * column re-supplied on each `upsertSiteConfig` call (it's a full upsert,
 * not a per-column patch) plus whichever asset URL is currently saved, for
 * the best-effort delete of a file an upload/clear is about to replace.
 * Falls back to the same Console defaults the Look tab itself starts from
 * when a tenant has no `site_config` row yet — imported for its theme
 * defaults only, this never touches the extra `chromeOn`/`logoHue` fields
 * `TLookFormValues` carries for the Look form's own state.
 */
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
