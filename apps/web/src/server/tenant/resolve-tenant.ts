import { queries } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';

import { isPlatformFallbackAllowed } from './is-platform-fallback-allowed';
import { isTenantServable } from './is-tenant-servable';

/**
 * A host matching a row that fails `isTenantServable` resolves to `undefined`, never the sole-tenant dev fallback, which is for "no domain matched".
 */
export const resolveTenant = async (
  host: string | null,
): Promise<TTenant | undefined> => {
  const tenant = host
    ? await queries.tenantDomains.getTenantByDomain(host)
    : undefined;
  if (tenant) {
    return isTenantServable(tenant) ? tenant : undefined;
  }

  if (!isPlatformFallbackAllowed()) return undefined;

  return resolveSoleTenant();
};

const resolveSoleTenant = async (): Promise<TTenant | undefined> => {
  const tenants = await queries.tenants.listTenants();
  if (tenants.length !== 1) return undefined;

  const [tenant] = tenants;
  return tenant && isTenantServable(tenant) ? tenant : undefined;
};

/**
 * No sole-tenant dev fallback: an id that fails to resolve is a data integrity gap, not "no host matched".
 */
export const resolveTenantById = async (
  tenantId: string,
): Promise<TTenant | undefined> => {
  const tenant = await queries.tenants.getTenantById(tenantId);
  return tenant && isTenantServable(tenant) ? tenant : undefined;
};
