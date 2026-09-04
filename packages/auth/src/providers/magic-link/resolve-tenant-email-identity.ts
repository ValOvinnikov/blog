import { resolveTenantEmailBrand, type TTenantEmailBrand } from '@blog/config';
import { queries } from '@blog/db';

export type TResolvedTenantEmailIdentity = {
  brand: TTenantEmailBrand;
  brandName: string;
};

/**
 * Resolves the tenant that owns `host` to its email brand, best-effort — a
 * host matching no tenant, a tenant with no site config yet, or a failed
 * lookup all yield `undefined` so the caller can render neutral rather than
 * fail delivery of the magic-link email itself.
 */
export async function resolveTenantEmailIdentity(
  host: string,
): Promise<TResolvedTenantEmailIdentity | undefined> {
  try {
    const tenant = await queries.tenantDomains.getTenantByDomain(host);
    if (!tenant) return undefined;

    const siteConfig = await queries.siteConfig.getSiteConfig(tenant.id);
    if (!siteConfig) return undefined;

    return {
      brand: resolveTenantEmailBrand({
        preset: siteConfig.preset,
        accentHue: siteConfig.accentHue,
        logoHue: siteConfig.logoHue,
      }),
      brandName: tenant.name,
    };
  } catch {
    return undefined;
  }
}
