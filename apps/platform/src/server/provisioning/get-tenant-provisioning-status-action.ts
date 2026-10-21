'use server';

import type { TMaybeUndefined } from '@blog/config';
import { queries } from '@blog/db';
import type { TTenantProvisioningStatusResult } from '@blog/db/queries/tenants/get-tenant-provisioning-status';
import { requireTenantOwnerOrAdmin } from '@platform/server/auth/require-tenant-owner-or-admin';

/** A lean re-query, not the full tenant row, so a tight poll interval stays cheap. */
export const getTenantProvisioningStatusAction = async (
  tenantId: string,
): Promise<TMaybeUndefined<TTenantProvisioningStatusResult>> => {
  await requireTenantOwnerOrAdmin(tenantId);
  return queries.tenants.getTenantProvisioningStatus(tenantId);
};
