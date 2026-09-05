import { getDb } from '@blog/db/client';
import {
  tenants,
  type TTenantDeprovisioningState,
} from '@blog/db/schema/tenants';
import { eq } from 'drizzle-orm';

export type TTenantDeprovisioningStatusResult = {
  deprovisioningSteps: TTenantDeprovisioningState | null;
  deprovisionedAt: Date | null;
};

export async function getTenantDeprovisioningStatus(
  tenantId: string,
): Promise<TTenantDeprovisioningStatusResult | undefined> {
  const db = getDb();

  const [tenant] = await db
    .select({
      deprovisioningSteps: tenants.deprovisioningSteps,
      deprovisionedAt: tenants.deprovisionedAt,
    })
    .from(tenants)
    .where(eq(tenants.id, tenantId));

  return tenant;
}
