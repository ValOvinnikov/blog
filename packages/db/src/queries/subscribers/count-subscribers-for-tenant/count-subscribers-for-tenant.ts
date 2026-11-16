import { getDb } from '@shinefold/db/client';
import { subscribers } from '@shinefold/db/schema/subscribers';
import { eq } from 'drizzle-orm';

export async function countSubscribersForTenant(
  tenantId: string,
): Promise<number> {
  const db = getDb();

  const rows = await db
    .select({ id: subscribers.id })
    .from(subscribers)
    .where(eq(subscribers.tenantId, tenantId));

  return rows.length;
}
