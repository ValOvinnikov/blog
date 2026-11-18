import 'server-only';

import {
  type TPlatformTenant,
  toPlatformTenant,
} from '@platform/utils/platform-tenant/platform-tenant';
import type { TMaybeUndefined } from '@shinefold/config';
import { queries } from '@shinefold/db';
import type { TGetTenantByIdOptions } from '@shinefold/db/queries/tenants/get-tenant-by-id/get-tenant-by-id';

export const getPlatformTenant = async (
  tenantId: string,
  options?: TGetTenantByIdOptions,
): Promise<TMaybeUndefined<TPlatformTenant>> => {
  const [tenant, grants] = await Promise.all([
    queries.tenants.getTenantById(tenantId, options),
    queries.tenantEntitlementGrants.listResolvableEntitlementGrants(tenantId),
  ]);

  return tenant && toPlatformTenant(tenant, grants);
};
