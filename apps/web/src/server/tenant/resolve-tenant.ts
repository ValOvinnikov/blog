import { queries } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';

import { isPlatformFallbackAllowed } from './is-platform-fallback-allowed';
import { isTenantServable } from './is-tenant-servable';

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

export const resolveTenantById = async (
  tenantId: string,
): Promise<TTenant | undefined> => {
  const tenant = await queries.tenants.getTenantById(tenantId);
  return tenant && isTenantServable(tenant) ? tenant : undefined;
};
