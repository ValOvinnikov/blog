import { getDb } from '@blog/db/client';
import { membershipInvites } from '@blog/db/schema/membership-invites';
import { memberships, type TMembership } from '@blog/db/schema/memberships';
import { and, eq, isNull } from 'drizzle-orm';

// Not a `db.transaction()` — the runtime `neon-http` driver has no
// multi-statement transaction support (see `unlinkProvider` for the same
// constraint elsewhere in this package). The claim step below is the
// atomic point that makes this safe under concurrency instead: it flips
// `consumedAt` only if the invite is still pending, in a single statement,
// so two concurrent calls for the same invite (e.g. a sign-in event firing
// twice) can never both proceed to insert a membership row — the losing
// call's claim matches zero rows and becomes a no-op.
//
// Idempotent: a missing or already-consumed invite id returns `undefined`
// rather than throwing. A membership that already exists for the (userId,
// tenantId) pair (e.g. this invite is redundant with one already granted)
// is returned as-is rather than erroring on the unique constraint.
//
// If the dependent membership insert fails (e.g. `userId` doesn't reference
// a real user), the claim is rolled back — `consumedAt` is reset to null —
// before rethrowing, so a failed call leaves the invite genuinely pending
// and retryable rather than permanently "consumed" with no membership ever
// created.
export async function consumeMembershipInvite(
  inviteId: string,
  userId: string,
): Promise<TMembership | undefined> {
  const db = getDb();

  const [claimed] = await db
    .update(membershipInvites)
    .set({ consumedAt: new Date() })
    .where(
      and(
        eq(membershipInvites.id, inviteId),
        isNull(membershipInvites.consumedAt),
      ),
    )
    .returning();

  if (!claimed) return undefined;

  try {
    const [inserted] = await db
      .insert(memberships)
      .values({ userId, tenantId: claimed.tenantId, role: claimed.role })
      .onConflictDoNothing()
      .returning();

    if (inserted) return inserted;

    const [existing] = await db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.userId, userId),
          eq(memberships.tenantId, claimed.tenantId),
        ),
      );

    return existing;
  } catch (error) {
    await db
      .update(membershipInvites)
      .set({ consumedAt: null })
      .where(eq(membershipInvites.id, claimed.id));
    throw error;
  }
}
