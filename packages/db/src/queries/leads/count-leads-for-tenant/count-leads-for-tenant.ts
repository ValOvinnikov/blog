import { getDb } from '@shinefold/db/client';
import { leads } from '@shinefold/db/schema/leads';
import { count, eq } from 'drizzle-orm';

export async function countLeadsForTenant(tenantId: string): Promise<number> {
  const db = getDb();

  const [row] = await db
    .select({ total: count() })
    .from(leads)
    .where(eq(leads.tenantId, tenantId));

  return row?.total ?? 0;
}
