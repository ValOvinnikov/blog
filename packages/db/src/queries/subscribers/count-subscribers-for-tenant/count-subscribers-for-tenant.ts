import { getDb } from '@blog/db/client';
import { subscribers } from '@blog/db/schema/subscribers';
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
