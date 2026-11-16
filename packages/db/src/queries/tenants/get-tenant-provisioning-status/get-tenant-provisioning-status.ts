import { getDb } from '@shinefold/db/client';
import type { TTenantProvisioningStatus } from '@shinefold/db/constants';
import {
  tenants,
  type TTenantProvisioningState,
} from '@shinefold/db/schema/tenants';
import { eq } from 'drizzle-orm';

export type TTenantProvisioningStatusResult = {
  provisioningStatus: TTenantProvisioningStatus | null;
  provisioningSteps: TTenantProvisioningState | null;
};

export async function getTenantProvisioningStatus(
  tenantId: string,
): Promise<TTenantProvisioningStatusResult | undefined> {
  const db = getDb();

  const [tenant] = await db
    .select({
      provisioningStatus: tenants.provisioningStatus,
      provisioningSteps: tenants.provisioningSteps,
    })
    .from(tenants)
    .where(eq(tenants.id, tenantId));

  return tenant;
}
