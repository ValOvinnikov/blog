import { getDb } from '@shinefold/db/client';
import { subscribers } from '@shinefold/db/schema/subscribers';
import { count, eq } from 'drizzle-orm';

export async function countSubscribersForTenant(
  tenantId: string,
): Promise<number> {
  const db = getDb();

  const [row] = await db
    .select({ total: count() })
    .from(subscribers)
    .where(eq(subscribers.tenantId, tenantId));

  return row?.total ?? 0;
}
