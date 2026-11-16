'use server';

import { requireTenantOwnerOrAdmin } from '@platform/server/auth/require-tenant-owner-or-admin';
import type { TMaybeUndefined } from '@shinefold/config';
import { queries } from '@shinefold/db';
import type { TTenantProvisioningStatusResult } from '@shinefold/db/queries/tenants/get-tenant-provisioning-status';

/** A lean re-query, not the full tenant row, so a tight poll interval stays cheap. */
export const getTenantProvisioningStatusAction = async (
  tenantId: string,
): Promise<TMaybeUndefined<TTenantProvisioningStatusResult>> => {
  await requireTenantOwnerOrAdmin(tenantId);
  return queries.tenants.getTenantProvisioningStatus(tenantId);
};
