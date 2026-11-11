import type { TLocaleIsoCode } from '@blog/config/constants';
import type { TMaybeUndefined } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import {
  siteConfig,
  type TSiteConfig,
  type TVoiceOverrides,
} from '@blog/db/schema/site-config';
import { tenants } from '@blog/db/schema/tenants';
import { eq } from 'drizzle-orm';

// Nullable columns are mapped to `undefined` so callers never reason about two "absent" representations.
export type TSiteConfigResult = Omit<
  TSiteConfig,
  'logoHue' | 'brandName' | 'logoAssetUrl' | 'faviconAssetUrl' | 'lookSavedAt'
> & {
  logoHue: TMaybeUndefined<number>;
  brandName: TMaybeUndefined<string>;
  logoAssetUrl: TMaybeUndefined<string>;
  faviconAssetUrl: TMaybeUndefined<string>;
  lookSavedAt: TMaybeUndefined<Date>;
  /** @deprecated The default locale's slice of `voiceOverridesByLocale`, kept until every caller reads per language. */
  voiceOverrides: TVoiceOverrides;
};

export function toSiteConfigResult(
  row: TSiteConfig,
  defaultLocale: TLocaleIsoCode,
): TSiteConfigResult {
  return {
    ...row,
    logoHue: row.logoHue ?? undefined,
    brandName: row.brandName ?? undefined,
    logoAssetUrl: row.logoAssetUrl ?? undefined,
    faviconAssetUrl: row.faviconAssetUrl ?? undefined,
    lookSavedAt: row.lookSavedAt ?? undefined,
    voiceOverrides: row.voiceOverridesByLocale[defaultLocale] ?? {},
  };
}

export async function getSiteConfig(
  tenantId: string,
): Promise<TMaybeUndefined<TSiteConfigResult>> {
  const db = getDb();

  const [row] = await db
    .select({ siteConfig, defaultLocale: tenants.locale })
    .from(siteConfig)
    .innerJoin(tenants, eq(tenants.id, siteConfig.tenantId))
    .where(eq(siteConfig.tenantId, tenantId));

  if (!row) return undefined;

  return toSiteConfigResult(row.siteConfig, row.defaultLocale);
}
