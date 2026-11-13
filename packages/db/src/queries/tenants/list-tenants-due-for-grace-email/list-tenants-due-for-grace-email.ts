import { getDb } from '@blog/db/client';
import type { TGraceEmail } from '@blog/db/constants';
import { graceEmailDue } from '@blog/db/queries/tenants/grace-due';
import { tenants, type TTenant } from '@blog/db/schema/tenants';

export async function listTenantsDueForGraceEmail(
  email: TGraceEmail,
  now: Date,
): Promise<TTenant[]> {
  return getDb().select().from(tenants).where(graceEmailDue(email, now));
}
