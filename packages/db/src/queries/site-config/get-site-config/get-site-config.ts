import { getDb } from '@blog/db/client';
import { siteConfig, type TSiteConfig } from '@blog/db/schema/site-config';
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
};

export function toSiteConfigResult(row: TSiteConfig): TSiteConfigResult {
  return {
    ...row,
    logoHue: row.logoHue ?? undefined,
    logoAssetUrl: row.logoAssetUrl ?? undefined,
    faviconAssetUrl: row.faviconAssetUrl ?? undefined,
  };
}

export async function getSiteConfig(
  tenantId: string,
): Promise<TSiteConfigResult | undefined> {
  const db = getDb();

  const [row] = await db
    .select()
    .from(siteConfig)
    .where(eq(siteConfig.tenantId, tenantId));

  if (!row) return undefined;

  return toSiteConfigResult(row);
}
