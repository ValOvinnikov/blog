import 'server-only';

import type { TMaybeNull, TMaybeUndefined } from '@blog/config';
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

export const setBrandAssetUrl = async (
  tenantId: string,
  kind: TBrandAssetKind,
  url: TMaybeNull<string>,
): Promise<void> => {
  const { preset } = await getSiteConfigOrDefaults(tenantId);

  await queries.siteConfig.upsertSiteConfig(tenantId, {
    preset,
    [assetColumn(kind)]: url,
  });
};
