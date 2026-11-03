import { getDb } from '@blog/db/client';
import { tenantSuspensions } from '@blog/db/schema/tenant-suspensions';
import { eq } from 'drizzle-orm';

export async function discardTenantSuspension(
  suspensionId: string,
): Promise<void> {
  await getDb()
    .delete(tenantSuspensions)
    .where(eq(tenantSuspensions.id, suspensionId));
}
