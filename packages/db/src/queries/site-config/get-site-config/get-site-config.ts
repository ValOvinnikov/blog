import type { TLocaleIsoCode } from '@shinefold/config/constants';
import type { TMaybeUndefined } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import {
  siteConfig,
  type TSiteConfig,
  type TVoiceOverrides,
} from '@shinefold/db/schema/site-config';
import { tenants } from '@shinefold/db/schema/tenants';
import { eq } from 'drizzle-orm';

// Nullable columns are mapped to `undefined` so callers never reason about two "absent" representations.
export type TSiteConfigResult = Omit<
  TSiteConfig,
  | 'logoHue'
  | 'brandName'
  | 'logoAssetUrl'
  | 'logoDarkAssetUrl'
  | 'faviconAssetUrl'
  | 'buttonColor'
  | 'buttonColorDark'
  | 'lookSavedAt'
  | 'voiceSavedAt'
> & {
  logoHue: TMaybeUndefined<number>;
  brandName: TMaybeUndefined<string>;
  logoAssetUrl: TMaybeUndefined<string>;
  logoDarkAssetUrl: TMaybeUndefined<string>;
  faviconAssetUrl: TMaybeUndefined<string>;
  buttonColor: TMaybeUndefined<string>;
  buttonColorDark: TMaybeUndefined<string>;
  lookSavedAt: TMaybeUndefined<Date>;
  voiceSavedAt: TMaybeUndefined<Date>;
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
    logoDarkAssetUrl: row.logoDarkAssetUrl ?? undefined,
    faviconAssetUrl: row.faviconAssetUrl ?? undefined,
    buttonColor: row.buttonColor ?? undefined,
    buttonColorDark: row.buttonColorDark ?? undefined,
    lookSavedAt: row.lookSavedAt ?? undefined,
    voiceSavedAt: row.voiceSavedAt ?? undefined,
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
