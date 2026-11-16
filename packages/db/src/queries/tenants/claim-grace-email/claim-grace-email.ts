import type { TMaybeNull } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import type { TGraceEmail } from '@shinefold/db/constants';
import {
  GRACE_EMAIL_STAMP,
  graceEmailDue,
} from '@shinefold/db/queries/tenants/grace-due';
import { tenants, type TTenant } from '@shinefold/db/schema/tenants';
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
