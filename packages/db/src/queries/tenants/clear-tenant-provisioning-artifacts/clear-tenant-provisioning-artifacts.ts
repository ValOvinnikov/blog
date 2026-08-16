import { getDb } from '@blog/db/client';
import { tenants } from '@blog/db/schema/tenants';
import { eq } from 'drizzle-orm';

// Setting every column back to null is naturally idempotent — safe to call
// again on a retry regardless of how much of it already ran.
export async function clearTenantProvisioningArtifacts(
  tenantId: string,
): Promise<void> {
  const db = getDb();

  await db
    .update(tenants)
    .set({
      sanityProjectId: null,
      sanityDataset: null,
      sanityReadTokenEncrypted: null,
      studioVercelProjectId: null,
      provisioningStatus: null,
      provisioningSteps: null,
    })
    .where(eq(tenants.id, tenantId));
}
