import { getDb } from '@shinefold/db/client';
import { graceEndDue } from '@shinefold/db/queries/tenants/grace-due';
import { tenants, type TTenant } from '@shinefold/db/schema/tenants';

export async function listTenantsDueForGraceEnd(now: Date): Promise<TTenant[]> {
  return getDb().select().from(tenants).where(graceEndDue(now));
}
