import { getDb } from '@shinefold/db/client';
import type { TGraceEmail } from '@shinefold/db/constants';
import { graceEmailDue } from '@shinefold/db/queries/tenants/grace-due';
import { tenants, type TTenant } from '@shinefold/db/schema/tenants';

export async function listTenantsDueForGraceEmail(
  email: TGraceEmail,
  now: Date,
): Promise<TTenant[]> {
  return getDb().select().from(tenants).where(graceEmailDue(email, now));
}
