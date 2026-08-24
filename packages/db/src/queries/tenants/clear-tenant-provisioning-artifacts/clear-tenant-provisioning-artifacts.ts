import { getDb } from '@blog/db/client';
import { tenants } from '@blog/db/schema/tenants';
import { eq } from 'drizzle-orm';

// Setting every column back to null is naturally idempotent — safe to call
// again on a retry regardless of how much of it already ran.
//
// `sanityProjectId` is the one conditional exception: the caller passes
// `keepSanityProjectId: true` only when the Sanity project itself wasn't
// actually deleted (blocked by org billing permission this script's token
// doesn't have) — a non-null `sanityProjectId` on an archived tenant is then
// the queryable signal that it still needs manual deletion. When deletion
// succeeded, it's nulled like every other column.
export async function clearTenantProvisioningArtifacts(
  tenantId: string,
  keepSanityProjectId: boolean,
): Promise<void> {
  const db = getDb();

  await db
    .update(tenants)
    .set({
      ...(keepSanityProjectId ? {} : { sanityProjectId: null }),
      sanityDataset: null,
      sanityReadTokenEncrypted: null,
      studioVercelProjectId: null,
      provisioningStatus: null,
      provisioningSteps: null,
    })
    .where(eq(tenants.id, tenantId));
}
