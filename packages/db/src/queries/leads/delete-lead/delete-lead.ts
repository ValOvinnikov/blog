import { getDb } from '@shinefold/db/client';
import { byLeadKey, type TLeadKey } from '@shinefold/db/queries/leads/lead-key';
import { leads } from '@shinefold/db/schema/leads';

export async function deleteLead(key: TLeadKey): Promise<boolean> {
  const db = getDb();

  const deleted = await db
    .delete(leads)
    .where(byLeadKey(key))
    .returning({ id: leads.id });

  return deleted.length > 0;
}
