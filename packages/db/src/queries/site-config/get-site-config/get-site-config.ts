import type { TLocaleIsoCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import {
  siteConfig,
  type TSiteConfig,
  type TVoiceOverrides,
} from '@blog/db/schema/site-config';
import { tenants } from '@blog/db/schema/tenants';
import { eq } from 'drizzle-orm';

// `logoHue`/`logoAssetUrl`/`faviconAssetUrl` are Postgres `null` when unset;
// mapped to `undefined` here so callers never have to reason about two
// different "absent" representations.
export type TSiteConfigResult = Omit<
  TSiteConfig,
  'logoHue' | 'logoAssetUrl' | 'faviconAssetUrl'
> & {
  logoHue: number | undefined;
  logoAssetUrl: string | undefined;
  faviconAssetUrl: string | undefined;
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
    logoAssetUrl: row.logoAssetUrl ?? undefined,
    faviconAssetUrl: row.faviconAssetUrl ?? undefined,
    voiceOverrides: row.voiceOverridesByLocale[defaultLocale] ?? {},
  };
}

export async function getSiteConfig(
  tenantId: string,
): Promise<TSiteConfigResult | undefined> {
  const db = getDb();

  const [row] = await db
    .select({ siteConfig, defaultLocale: tenants.locale })
    .from(siteConfig)
    .innerJoin(tenants, eq(tenants.id, siteConfig.tenantId))
    .where(eq(siteConfig.tenantId, tenantId));

  if (!row) return undefined;

  return toSiteConfigResult(row.siteConfig, row.defaultLocale);
}
