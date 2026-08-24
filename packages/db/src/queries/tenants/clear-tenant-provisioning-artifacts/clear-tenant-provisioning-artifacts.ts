import { getDb } from '@blog/db/client';
import { tenants } from '@blog/db/schema/tenants';
import { eq } from 'drizzle-orm';

// Setting every column back to null is naturally idempotent — safe to call
// again on a retry regardless of how much of it already ran.
//
// `sanityProjectId` is the one exception: it deliberately stays populated
// here. Deleting a Sanity project requires org billing permission this
// script's token doesn't have, so the project is routinely left behind for
// manual deletion — a non-null `sanityProjectId` on an archived tenant is
// the queryable signal that it still needs one.
export async function clearTenantProvisioningArtifacts(
  tenantId: string,
): Promise<void> {
  const db = getDb();

  await db
    .update(tenants)
    .set({
      sanityDataset: null,
      sanityReadTokenEncrypted: null,
      studioVercelProjectId: null,
      provisioningStatus: null,
      provisioningSteps: null,
    })
    .where(eq(tenants.id, tenantId));
}
