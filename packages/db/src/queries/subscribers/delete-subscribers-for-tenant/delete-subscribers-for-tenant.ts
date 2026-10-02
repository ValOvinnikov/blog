import { getDb } from '@blog/db/client';
import { subscribers } from '@blog/db/schema/subscribers';
import { eq } from 'drizzle-orm';

// Permanently removes every `subscribers` row for the tenant — the
// deprovisioning `purge-reader-data` step's reader-data purge, never called
// from the newsletter sign-up/unsubscribe flows (see `unsubscribe` for the
// single-reader path).
export async function deleteSubscribersForTenant(
  tenantId: string,
): Promise<number> {
  const db = getDb();

  const deleted = await db
    .delete(subscribers)
    .where(eq(subscribers.tenantId, tenantId))
    .returning();

  return deleted.length;
}
