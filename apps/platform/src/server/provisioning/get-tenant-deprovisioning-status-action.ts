'use server';

import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import type { TMaybeUndefined } from '@shinefold/config';
import { queries } from '@shinefold/db';
import type { TTenantDeprovisioningStatusResult } from '@shinefold/db/queries/tenants/get-tenant-deprovisioning-status';

/** A lean re-query, not the full tenant row, so a tight poll interval stays cheap. */
export const getTenantDeprovisioningStatusAction = async (
  tenantId: string,
): Promise<TMaybeUndefined<TTenantDeprovisioningStatusResult>> => {
  await requireSuperAdmin();
  return queries.tenants.getTenantDeprovisioningStatus(tenantId);
};
