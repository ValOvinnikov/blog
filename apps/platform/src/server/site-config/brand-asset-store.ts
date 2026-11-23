import 'server-only';

import {
  getSiteConfigOrDefaults,
  type TSiteConfigThemeAndAssets,
} from '@platform/server/site-config/site-config-or-defaults';
import type { TBrandAssetKind } from '@platform/utils/brand-asset-limits/brand-asset-limits';
import type { TMaybeNull, TMaybeUndefined } from '@shinefold/config';
import { queries } from '@shinefold/db';
import { LOOK_FIELD } from '@shinefold/db/constants';

const ASSET_COLUMN = {
  logo: LOOK_FIELD.LOGO_ASSET_URL,
  logoDark: LOOK_FIELD.LOGO_DARK_ASSET_URL,
  favicon: LOOK_FIELD.FAVICON_ASSET_URL,
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
