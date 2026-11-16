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
  const tenant = await queries.tenants.getTenantById(tenantId, options);

  return tenant && toPlatformTenant(tenant);
};
