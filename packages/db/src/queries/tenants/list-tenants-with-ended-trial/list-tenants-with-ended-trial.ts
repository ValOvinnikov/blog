import { getDb } from '@shinefold/db/client';
import { hasEndedUnpaidTrial } from '@shinefold/db/queries/tenants/ended-trial';
import { tenants, type TTenant } from '@shinefold/db/schema/tenants';

export async function listTenantsWithEndedTrial(now: Date): Promise<TTenant[]> {
  return getDb().select().from(tenants).where(hasEndedUnpaidTrial(now));
}
