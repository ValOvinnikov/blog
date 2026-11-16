import { getDb } from '@shinefold/db/client';
import { tenants } from '@shinefold/db/schema/tenants';
import { eq } from 'drizzle-orm';

export async function recordTenantContentMigrationFailure(
  tenantId: string,
  contentMigrationFailedAt: Date,
): Promise<void> {
  await getDb()
    .update(tenants)
    .set({ contentMigrationFailedAt })
    .where(eq(tenants.id, tenantId));
}
