import { getDb } from '@blog/db/client';
import { leads } from '@blog/db/schema/leads';
import { eq } from 'drizzle-orm';

export async function deleteLeadsForTenant(tenantId: string): Promise<number> {
  const db = getDb();

  const deleted = await db
    .delete(leads)
    .where(eq(leads.tenantId, tenantId))
    .returning({ id: leads.id });

  return deleted.length;
}
