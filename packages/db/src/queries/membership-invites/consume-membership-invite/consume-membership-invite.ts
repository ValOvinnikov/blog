import type { TMaybeUndefined } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import {
  planSeats,
  unlockedMembershipsCount,
} from '@blog/db/queries/membership-invites/create-membership-invite/seat-limit';
import { createMembership } from '@blog/db/queries/memberships';
import { membershipInvites } from '@blog/db/schema/membership-invites';
import type { TMembership } from '@blog/db/schema/memberships';
import { tenants } from '@blog/db/schema/tenants';
import { and, eq, isNull, or, sql } from 'drizzle-orm';

function hasSeatFor(invite: typeof membershipInvites) {
  return or(
    eq(invite.role, MEMBERSHIP_ROLE.OWNER),
    sql`${unlockedMembershipsCount(invite.tenantId)} < (select ${planSeats()} from ${tenants} where ${eq(tenants.id, invite.tenantId)})`,
  );
}

// Of two concurrent calls only one claims the invite, a failed insert gives the claim back, and an invite past the plan's seats stays pending.
export async function consumeMembershipInvite(
  inviteId: string,
  userId: string,
): Promise<TMaybeUndefined<TMembership>> {
  const db = getDb();

  const [claimed] = await db
    .update(membershipInvites)
    .set({ consumedAt: new Date() })
    .where(
      and(
        eq(membershipInvites.id, inviteId),
        isNull(membershipInvites.consumedAt),
        hasSeatFor(membershipInvites),
      ),
    )
    .returning();

  if (!claimed) return undefined;

  try {
    return await createMembership(userId, claimed.tenantId, claimed.role);
  } catch (error) {
    await db
      .update(membershipInvites)
      .set({ consumedAt: null })
      .where(eq(membershipInvites.id, claimed.id));
    throw error;
  }
}
