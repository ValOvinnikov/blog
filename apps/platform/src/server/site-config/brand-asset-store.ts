import 'server-only';

import {
  getSiteConfigOrDefaults,
  type TSiteConfigThemeAndAssets,
} from '@platform/server/site-config/site-config-or-defaults';
import type { TBrandAssetKind } from '@platform/utils/brand-asset-limits/brand-asset-limits';
import type { TMaybeNull, TMaybeUndefined } from '@shinefold/config';
import { queries } from '@shinefold/db';

const ASSET_COLUMN = {
  logo: 'logoAssetUrl',
  logoDark: 'logoDarkAssetUrl',
  favicon: 'faviconAssetUrl',
} as const satisfies Record<TBrandAssetKind, keyof TSiteConfigThemeAndAssets>;

export const getBrandAssetUrl = async (
  tenantId: string,
  kind: TBrandAssetKind,
): Promise<TMaybeUndefined<string>> => {
  const current = await getSiteConfigOrDefaults(tenantId);
  return current[ASSET_COLUMN[kind]];
};

export const setBrandAssetUrl = async (
  tenantId: string,
  kind: TBrandAssetKind,
  url: TMaybeNull<string>,
): Promise<void> => {
  const { preset } = await getSiteConfigOrDefaults(tenantId);

  await queries.siteConfig.upsertSiteConfig(tenantId, {
    preset,
    [ASSET_COLUMN[kind]]: url,
  });
};
