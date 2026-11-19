import { getDb } from '@shinefold/db/client';
import { subscribers } from '@shinefold/db/schema/subscribers';
import { eq } from 'drizzle-orm';

export async function deleteSubscribersForTenant(
  tenantId: string,
): Promise<number> {
  const db = getDb();

  const deleted = await db
    .delete(subscribers)
    .where(eq(subscribers.tenantId, tenantId))
    .returning({ id: subscribers.id });

  return deleted.length;
}
