import type { TMaybeUndefined } from '@shinefold/config';
import type { TTenantEntitlements } from '@shinefold/db/utils/resolve-tenant-entitlements/resolve-tenant-entitlements';
import { safeAsync } from '@shinefold/utils';
import { getRequestTenantId } from '@web/server/tenant/request-tenant/request-tenant';
import { getCachedTenantEntitlements } from '@web/server/tenant/tenant-entitlements/tenant-entitlements';

const getTenantEntitlementsForTenantId = safeAsync(
  async (tenantId?: string): Promise<TMaybeUndefined<TTenantEntitlements>> =>
    tenantId ? getCachedTenantEntitlements(tenantId) : undefined,
);

export const getTenantEntitlements = async (tenant: string) =>
  getTenantEntitlementsForTenantId(await getRequestTenantId(tenant));
