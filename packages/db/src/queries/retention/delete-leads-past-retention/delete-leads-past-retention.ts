import { getDb } from '@shinefold/db/client';
import { LEAD_RETENTION_MONTHS } from '@shinefold/db/constants';
import { isInBatch } from '@shinefold/db/queries/retention/retention-batch';
import { monthsBefore } from '@shinefold/db/queries/retention/retention-cutoff';
import { leads } from '@shinefold/db/schema/leads';
import { lt } from 'drizzle-orm';

export async function deleteLeadsPastRetention(
  now: Date,
  limit: number,
): Promise<number> {
  const db = getDb();
  const batch = db
    .select({ id: leads.id })
    .from(leads)
    .where(lt(leads.createdAt, monthsBefore(now, LEAD_RETENTION_MONTHS)))
    .limit(limit);

  const deleted = await db
    .delete(leads)
    .where(isInBatch(leads.id, batch))
    .returning({ id: leads.id });

  return deleted.length;
}
