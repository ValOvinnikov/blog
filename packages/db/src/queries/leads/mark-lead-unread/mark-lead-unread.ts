import { getDb } from '@shinefold/db/client';
import { byLeadKey, type TLeadKey } from '@shinefold/db/queries/leads/lead-key';
import { leads } from '@shinefold/db/schema/leads';

export async function markLeadUnread(key: TLeadKey): Promise<boolean> {
  const db = getDb();

  const updated = await db
    .update(leads)
    .set({ readAt: null })
    .where(byLeadKey(key))
    .returning({ id: leads.id });

  return updated.length > 0;
}
