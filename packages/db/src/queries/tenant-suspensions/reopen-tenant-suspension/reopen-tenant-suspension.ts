import { getDb } from '@shinefold/db/client';
import { tenantSuspensions } from '@shinefold/db/schema/tenant-suspensions';
import { eq } from 'drizzle-orm';

export async function reopenTenantSuspension(
  suspensionId: string,
): Promise<void> {
  await getDb()
    .update(tenantSuspensions)
    .set({ liftedAt: null, liftedBy: null })
    .where(eq(tenantSuspensions.id, suspensionId));
}
