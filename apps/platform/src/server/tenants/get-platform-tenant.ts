import 'server-only';

import type { TMaybeUndefined } from '@blog/config';
import { queries } from '@blog/db';
import type { TGetTenantByIdOptions } from '@blog/db/queries/tenants/get-tenant-by-id/get-tenant-by-id';
import {
  type TPlatformTenant,
  toPlatformTenant,
} from '@platform/utils/platform-tenant/platform-tenant';

export const getPlatformTenant = async (
  tenantId: string,
  options?: TGetTenantByIdOptions,
): Promise<TMaybeUndefined<TPlatformTenant>> => {
  const tenant = await queries.tenants.getTenantById(tenantId, options);

  return tenant && toPlatformTenant(tenant);
};
