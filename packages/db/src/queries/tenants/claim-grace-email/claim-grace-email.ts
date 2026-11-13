import type { TMaybeNull } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import type { TGraceEmail } from '@blog/db/constants';
import {
  GRACE_EMAIL_STAMP,
  graceEmailDue,
} from '@blog/db/queries/tenants/grace-due';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { and, eq } from 'drizzle-orm';

// Returns the tenant only to the one caller that stamped the email.
export async function claimGraceEmail(
  tenantId: string,
  email: TGraceEmail,
  now: Date,
): Promise<TMaybeNull<TTenant>> {
  const [claimed] = await getDb()
    .update(tenants)
    .set({ [GRACE_EMAIL_STAMP[email]]: now })
    .where(and(eq(tenants.id, tenantId), graceEmailDue(email, now)))
    .returning();

  return claimed ?? null;
}
