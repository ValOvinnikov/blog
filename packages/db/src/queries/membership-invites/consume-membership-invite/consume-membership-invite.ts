import type { TMaybeUndefined } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import { MEMBERSHIP_ROLE } from '@shinefold/db/constants';
import {
  planSeats,
  unlockedMembershipsCount,
} from '@shinefold/db/queries/membership-invites/create-membership-invite/seat-limit';
import {
  createMembership,
  lockMembershipsOverSeats,
} from '@shinefold/db/queries/memberships';
import { membershipInvites } from '@shinefold/db/schema/membership-invites';
import type { TMembership } from '@shinefold/db/schema/memberships';
import { tenants } from '@shinefold/db/schema/tenants';
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

  let membership: TMembership;
  try {
    membership = await createMembership(userId, claimed.tenantId, claimed.role);
  } catch (error) {
    await db
      .update(membershipInvites)
      .set({ consumedAt: null })
      .where(eq(membershipInvites.id, claimed.id));
    throw error;
  }

  if (claimed.role !== MEMBERSHIP_ROLE.OWNER) {
    await lockMembershipsPastPlanSeats(claimed.tenantId);
  }
  return membership;
}

// Two invites accepted at once can both pass the claim's seat check, so the
// member who joined last is locked whenever the site ends up over its seats.
async function lockMembershipsPastPlanSeats(tenantId: string): Promise<void> {
  const [tenant] = await getDb()
    .select({ plan: tenants.plan })
    .from(tenants)
    .where(eq(tenants.id, tenantId));
  if (!tenant) return;

  await lockMembershipsOverSeats(tenantId, tenant.plan, new Date());
}
