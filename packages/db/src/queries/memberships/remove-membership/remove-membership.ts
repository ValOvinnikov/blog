import type { TMaybeNull } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import {
  MEMBERSHIP_REMOVAL_OUTCOME,
  MEMBERSHIP_ROLE,
  type TMembershipRemovalOutcome,
} from '@shinefold/db/constants';
import { inviteEmailColumns } from '@shinefold/db/queries/membership-invites/invite-email-columns';
import { users } from '@shinefold/db/schema/auth';
import { membershipInvites } from '@shinefold/db/schema/membership-invites';
import { memberships } from '@shinefold/db/schema/memberships';
import { isUuid } from '@shinefold/db/utils/is-uuid/is-uuid';
import { decryptOptionalPersonalValue } from '@shinefold/db/utils/personal-data/personal-data';
import { hasLength } from '@shinefold/utils/primitives';
import { and, eq, exists, isNotNull, ne, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

function keepsAnotherOwner() {
  const otherOwner = alias(memberships, 'other_owner');

  return or(
    ne(memberships.role, MEMBERSHIP_ROLE.OWNER),
    exists(
      getDb()
        .select({ id: otherOwner.id })
        .from(otherOwner)
        .where(
          and(
            eq(otherOwner.tenantId, memberships.tenantId),
            eq(otherOwner.role, MEMBERSHIP_ROLE.OWNER),
            ne(otherOwner.id, memberships.id),
          ),
        ),
    ),
  );
}

// One statement, because `neon-http` has no transactions: the membership and
// its consumed invite go together, so a failure never leaves the address
// stuck as already invited.
async function deleteMembershipAndConsumedInvite(
  tenantId: string,
  membershipId: string,
  email: TMaybeNull<string>,
): Promise<boolean> {
  const db = getDb();
  const removed = db.$with('removed_membership').as(
    db
      .delete(memberships)
      .where(and(eq(memberships.id, membershipId), keepsAnotherOwner()))
      .returning({ id: memberships.id }),
  );
  const clearedInvite = db.$with('cleared_invite').as(
    db
      .delete(membershipInvites)
      .where(
        and(
          eq(membershipInvites.tenantId, tenantId),
          eq(
            membershipInvites.emailExactIndex,
            email ? inviteEmailColumns(email).emailExactIndex : sql`null`,
          ),
          isNotNull(membershipInvites.consumedAt),
          exists(db.select({ id: removed.id }).from(removed)),
        ),
      )
      .returning({ id: membershipInvites.id }),
  );

  const rows = await db
    .with(removed, clearedInvite)
    .select({ id: removed.id })
    .from(removed);

  return hasLength(rows);
}

export async function removeMembership(
  tenantId: string,
  membershipId: string,
  actingUserId: string,
): Promise<TMembershipRemovalOutcome> {
  if (!isUuid(membershipId)) return MEMBERSHIP_REMOVAL_OUTCOME.NOT_FOUND;

  const [member] = await getDb()
    .select({
      userId: memberships.userId,
      role: memberships.role,
      emailEncrypted: users.emailEncrypted,
    })
    .from(memberships)
    .innerJoin(users, eq(memberships.userId, users.id))
    .where(
      and(eq(memberships.id, membershipId), eq(memberships.tenantId, tenantId)),
    );

  if (!member) return MEMBERSHIP_REMOVAL_OUTCOME.NOT_FOUND;

  const { userId, role, emailEncrypted } = member;
  if (userId === actingUserId) return MEMBERSHIP_REMOVAL_OUTCOME.SELF;

  const removed = await deleteMembershipAndConsumedInvite(
    tenantId,
    membershipId,
    decryptOptionalPersonalValue(emailEncrypted),
  );

  if (removed) return MEMBERSHIP_REMOVAL_OUTCOME.REMOVED;

  return role === MEMBERSHIP_ROLE.OWNER
    ? MEMBERSHIP_REMOVAL_OUTCOME.LAST_OWNER
    : MEMBERSHIP_REMOVAL_OUTCOME.NOT_FOUND;
}
