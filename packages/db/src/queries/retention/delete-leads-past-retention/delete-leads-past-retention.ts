import { getDb } from '@blog/db/client';
import { LEAD_RETENTION_MONTHS } from '@blog/db/constants';
import { monthsBefore } from '@blog/db/queries/retention/retention-cutoff';
import { leads } from '@blog/db/schema/leads';
import { lt } from 'drizzle-orm';

export async function deleteLeadsPastRetention(now: Date): Promise<number> {
  const deleted = await getDb()
    .delete(leads)
    .where(lt(leads.createdAt, monthsBefore(now, LEAD_RETENTION_MONTHS)))
    .returning({ id: leads.id });

  return deleted.length;
}
