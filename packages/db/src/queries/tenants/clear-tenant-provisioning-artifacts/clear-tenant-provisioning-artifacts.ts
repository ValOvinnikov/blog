import { getDb } from '@blog/db/client';
import { tenants } from '@blog/db/schema/tenants';
import { eq } from 'drizzle-orm';

// `sanityProjectId`/`sanityDataset` stay set: the archived project outlives
// deprovisioning, and a later permanent deletion needs the pointer to it.
export async function clearTenantProvisioningArtifacts(
  tenantId: string,
): Promise<void> {
  const db = getDb();

  await db
    .update(tenants)
    .set({
      sanityReadTokenEncrypted: null,
      sanityWriteTokenEncrypted: null,
      sanityManagementTokenEncrypted: null,
      provisioningStatus: null,
      provisioningSteps: null,
      seededAt: null,
    })
    .where(eq(tenants.id, tenantId));
}
