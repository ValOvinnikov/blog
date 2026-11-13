import { getDb } from '@blog/db/client';
import { graceEndDue } from '@blog/db/queries/tenants/grace-due';
import { tenants, type TTenant } from '@blog/db/schema/tenants';

export async function listTenantsDueForGraceEnd(now: Date): Promise<TTenant[]> {
  return getDb().select().from(tenants).where(graceEndDue(now));
}
