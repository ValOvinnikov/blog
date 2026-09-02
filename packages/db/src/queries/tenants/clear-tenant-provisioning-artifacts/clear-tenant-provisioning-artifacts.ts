import { getDb } from '@blog/db/client';
import { tenants } from '@blog/db/schema/tenants';
import { eq } from 'drizzle-orm';

// Setting every column back to null is naturally idempotent — safe to call
// again on a retry regardless of how much of it already ran.
//
// `sanityProjectId`/`sanityDataset` are the exception: deprovisioning
// archives the tenant's Sanity project rather than deleting it, so it still
// exists afterwards — these columns stay populated as the pointer a later
// permanent tenant deletion needs to clean it up, rather than nulled like
// every other provisioning-artifact column.
export async function clearTenantProvisioningArtifacts(
  tenantId: string,
): Promise<void> {
  const db = getDb();

  await db
    .update(tenants)
    .set({
      sanityReadTokenEncrypted: null,
      sanityWriteTokenEncrypted: null,
      studioVercelProjectId: null,
      provisioningStatus: null,
      provisioningSteps: null,
    })
    .where(eq(tenants.id, tenantId));
}
