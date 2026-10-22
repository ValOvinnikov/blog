import { getDb } from '@blog/db/client';
import { byLeadKey, type TLeadKey } from '@blog/db/queries/leads/lead-key';
import { leads } from '@blog/db/schema/leads';

export async function markLeadUnread(key: TLeadKey): Promise<boolean> {
  const db = getDb();

  const updated = await db
    .update(leads)
    .set({ readAt: null })
    .where(byLeadKey(key))
    .returning({ id: leads.id });

  return updated.length > 0;
}
