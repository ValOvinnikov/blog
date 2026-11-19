import { LEAD_RETENTION_MONTHS } from '@shinefold/db/constants';
import { deleteRetentionBatch } from '@shinefold/db/queries/retention/retention-batch';
import { monthsBefore } from '@shinefold/db/queries/retention/retention-cutoff';
import { leads } from '@shinefold/db/schema/leads';
import { lt } from 'drizzle-orm';

export async function deleteLeadsPastRetention(
  now: Date,
  limit: number,
): Promise<number> {
  return deleteRetentionBatch(
    leads,
    [leads.id],
    lt(leads.createdAt, monthsBefore(now, LEAD_RETENTION_MONTHS)),
    limit,
  );
}
