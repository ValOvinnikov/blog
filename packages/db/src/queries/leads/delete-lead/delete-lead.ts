import { getDb } from '@blog/db/client';
import { byLeadKey, type TLeadKey } from '@blog/db/queries/leads/lead-key';
import { leads } from '@blog/db/schema/leads';

export async function deleteLead(key: TLeadKey): Promise<boolean> {
  const db = getDb();

  const deleted = await db
    .delete(leads)
    .where(byLeadKey(key))
    .returning({ id: leads.id });

  return deleted.length > 0;
}
