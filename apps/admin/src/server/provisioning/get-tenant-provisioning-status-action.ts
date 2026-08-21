'use server';

import { requireAdmin } from '@admin/server/auth/require-admin';
import { queries } from '@blog/db';
import type { TTenantProvisioningStatusResult } from '@blog/db/queries/tenants/get-tenant-provisioning-status';

/**
 * Polled by `ProvisioningStatusView` while a tenant's provisioning is still
 * in progress — a lean re-query (status + step map only, not the full
 * tenant row) so a tight interval stays cheap.
 */
export const getTenantProvisioningStatusAction = async (
  tenantId: string,
): Promise<TTenantProvisioningStatusResult | undefined> => {
  await requireAdmin();
  return queries.tenants.getTenantProvisioningStatus(tenantId);
};
