'use server';

import type { TMaybeUndefined } from '@blog/config';
import { queries } from '@blog/db';
import type { TTenantDeprovisioningStatusResult } from '@blog/db/queries/tenants/get-tenant-deprovisioning-status';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';

/** A lean re-query, not the full tenant row, so a tight poll interval stays cheap. */
export const getTenantDeprovisioningStatusAction = async (
  tenantId: string,
): Promise<TMaybeUndefined<TTenantDeprovisioningStatusResult>> => {
  await requireSuperAdmin();
  return queries.tenants.getTenantDeprovisioningStatus(tenantId);
};
