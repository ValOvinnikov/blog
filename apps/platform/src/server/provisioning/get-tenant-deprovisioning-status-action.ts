'use server';

import { queries } from '@blog/db';
import type { TTenantDeprovisioningStatusResult } from '@blog/db/queries/tenants/get-tenant-deprovisioning-status';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';

/**
 * Polled by `DeprovisioningStatusView` while a tenant's teardown is still in
 * progress — a lean re-query (step map + run marker only, not the full
 * tenant row) so a tight interval stays cheap.
 */
export const getTenantDeprovisioningStatusAction = async (
  tenantId: string,
): Promise<TTenantDeprovisioningStatusResult | undefined> => {
  await requireSuperAdmin();
  return queries.tenants.getTenantDeprovisioningStatus(tenantId);
};
