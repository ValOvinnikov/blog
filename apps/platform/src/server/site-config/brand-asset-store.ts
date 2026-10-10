import 'server-only';

import type { TMaybeUndefined } from '@blog/config';
import { queries } from '@blog/db';
import { getSiteConfigOrDefaults } from '@platform/server/site-config/site-config-or-defaults';
import type { TBrandAssetKind } from '@platform/utils/brand-asset-limits/brand-asset-limits';

const assetColumn = (kind: TBrandAssetKind) =>
  kind === 'logo' ? 'logoAssetUrl' : 'faviconAssetUrl';

export const getBrandAssetUrl = async (
  tenantId: string,
  kind: TBrandAssetKind,
): Promise<TMaybeUndefined<string>> => {
  const current = await getSiteConfigOrDefaults(tenantId);
  return current[assetColumn(kind)];
};

// upsertSiteConfig requires every theme column, so the current ones are re-supplied unchanged.
export const setBrandAssetUrl = async (
  tenantId: string,
  kind: TBrandAssetKind,
  url: string | null,
): Promise<void> => {
  const { preset, accentHue, headingFont, bodyFont, radiusScale, density } =
    await getSiteConfigOrDefaults(tenantId);

  await queries.siteConfig.upsertSiteConfig(tenantId, {
    preset,
    accentHue,
    headingFont,
    bodyFont,
    radiusScale,
    density,
    [assetColumn(kind)]: url,
  });
};
