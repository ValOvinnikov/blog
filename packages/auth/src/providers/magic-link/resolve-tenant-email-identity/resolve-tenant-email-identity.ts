import {
  resolveTenantEmailBrand,
  type TMaybeUndefined,
  type TTenantEmailBrand,
} from '@shinefold/config';
import type { TLocaleIsoCode } from '@shinefold/config/constants';
import { queries } from '@shinefold/db';
import { resolveTenantEntitlements } from '@shinefold/db/utils/resolve-tenant-entitlements/resolve-tenant-entitlements';

export type TResolvedTenantEmailIdentity = {
  brand: TTenantEmailBrand;
  brandName: string;
  tenantId: string;
  defaultLocale: TLocaleIsoCode;
  liveLocales: TLocaleIsoCode[];
};

/** Any failed lookup yields `undefined`, so the email renders neutral instead of failing delivery. */
export async function resolveTenantEmailIdentity(
  host: string,
): Promise<TMaybeUndefined<TResolvedTenantEmailIdentity>> {
  try {
    const tenant = await queries.tenantDomains.getTenantByDomain(host);
    if (!tenant) return undefined;

    const [siteConfig, grants] = await Promise.all([
      queries.siteConfig.getSiteConfig(tenant.id),
      queries.tenantEntitlementGrants.listResolvableEntitlementGrants(
        tenant.id,
      ),
    ]);
    if (!siteConfig) return undefined;

    return {
      brand: resolveTenantEmailBrand({
        preset: siteConfig.preset,
        accentHue: siteConfig.accentHue,
        logoHue: siteConfig.logoHue,
      }),
      brandName: tenant.name,
      tenantId: tenant.id,
      defaultLocale: tenant.locale,
      liveLocales: queries.tenants.selectLiveLocalesWithin(
        tenant,
        resolveTenantEntitlements(tenant.plan, grants, new Date()),
      ),
    };
  } catch {
    return undefined;
  }
}
