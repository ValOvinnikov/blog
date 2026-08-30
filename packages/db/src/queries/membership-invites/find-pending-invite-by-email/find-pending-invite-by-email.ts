import { getDb } from '@blog/db/client';
import {
  membershipInvites,
  type TMembershipInvite,
} from '@blog/db/schema/membership-invites';
import { normalizeEmail } from '@blog/db/utils/normalize-email/normalize-email';
import { and, eq, isNull } from 'drizzle-orm';

// Returns every still-pending invite for `email`, across every tenant it
// was invited to — not just one. The unique constraint on
// `membershipInvites` is scoped to (tenantId, email), not email alone, so
// the same address can hold a distinct pending invite per tenant (the
// eventual Team-tab reuse case). A caller consuming invites at sign-in time
// must iterate every match rather than assume at most one.
export async function findPendingInviteByEmail(
  email: string,
): Promise<TMembershipInvite[]> {
  const db = getDb();
  const normalizedEmail = normalizeEmail(email);

  return db
    .select()
    .from(membershipInvites)
    .where(
      and(
        eq(membershipInvites.email, normalizedEmail),
        isNull(membershipInvites.consumedAt),
      ),
    );
}
