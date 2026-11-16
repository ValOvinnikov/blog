import { getDb } from '@shinefold/db/client';
import { tenantSuspensions } from '@shinefold/db/schema/tenant-suspensions';
import { eq } from 'drizzle-orm';

export async function discardTenantSuspension(
  suspensionId: string,
): Promise<void> {
  await getDb()
    .delete(tenantSuspensions)
    .where(eq(tenantSuspensions.id, suspensionId));
}
