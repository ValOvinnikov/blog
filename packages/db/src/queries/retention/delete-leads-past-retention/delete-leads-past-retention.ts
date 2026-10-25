import { getDb } from '@blog/db/client';
import { LEAD_RETENTION_MONTHS } from '@blog/db/constants';
import { isInBatch } from '@blog/db/queries/retention/retention-batch';
import { monthsBefore } from '@blog/db/queries/retention/retention-cutoff';
import { leads } from '@blog/db/schema/leads';
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
