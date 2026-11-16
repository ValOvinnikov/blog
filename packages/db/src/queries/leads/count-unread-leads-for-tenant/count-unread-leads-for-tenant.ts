import { getDb } from '@shinefold/db/client';
import { leads } from '@shinefold/db/schema/leads';
import { and, count, eq, isNull } from 'drizzle-orm';

export async function countUnreadLeadsForTenant(
  tenantId: string,
): Promise<number> {
  const db = getDb();

  const [row] = await db
    .select({ total: count() })
    .from(leads)
    .where(and(eq(leads.tenantId, tenantId), isNull(leads.readAt)));

  return row?.total ?? 0;
}
