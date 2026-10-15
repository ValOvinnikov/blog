import { getDb } from '@blog/db/client';
import { leads } from '@blog/db/schema/leads';
import { and, eq } from 'drizzle-orm';

export type TDeleteLeadInput = {
  tenantId: string;
  id: string;
};

export async function deleteLead({
  tenantId,
  id,
}: TDeleteLeadInput): Promise<boolean> {
  const db = getDb();

  const deleted = await db
    .delete(leads)
    .where(and(eq(leads.tenantId, tenantId), eq(leads.id, id)))
    .returning({ id: leads.id });

  return deleted.length > 0;
}
