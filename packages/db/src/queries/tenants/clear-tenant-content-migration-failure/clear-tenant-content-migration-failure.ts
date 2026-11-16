import { getDb } from '@shinefold/db/client';
import { tenants } from '@shinefold/db/schema/tenants';
import { eq } from 'drizzle-orm';

export async function clearTenantContentMigrationFailure(
  tenantId: string,
): Promise<void> {
  await getDb()
    .update(tenants)
    .set({ contentMigrationFailedAt: null })
    .where(eq(tenants.id, tenantId));
}
