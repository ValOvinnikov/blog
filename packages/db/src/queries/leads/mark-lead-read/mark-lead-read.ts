import { getDb } from '@shinefold/db/client';
import { byLeadKey, type TLeadKey } from '@shinefold/db/queries/leads/lead-key';
import { leads } from '@shinefold/db/schema/leads';
import { sql } from 'drizzle-orm';

export async function markLeadRead(key: TLeadKey): Promise<boolean> {
  const db = getDb();

  const updated = await db
    .update(leads)
    .set({ readAt: sql`coalesce(${leads.readAt}, now())` })
    .where(byLeadKey(key))
    .returning({ id: leads.id });

  return updated.length > 0;
}
