import { getDb } from '@blog/db/client';
import { hasEndedUnpaidTrial } from '@blog/db/queries/tenants/ended-trial';
import { tenants, type TTenant } from '@blog/db/schema/tenants';

export async function listTenantsWithEndedTrial(now: Date): Promise<TTenant[]> {
  return getDb().select().from(tenants).where(hasEndedUnpaidTrial(now));
}
