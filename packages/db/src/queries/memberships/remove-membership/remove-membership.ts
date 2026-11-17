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
import { decryptOptionalPersonalValue } from '@shinefold/db/utils/personal-data/personal-data';
import { and, eq, exists, isNotNull, ne, or } from 'drizzle-orm';
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

async function clearConsumedInvite(
  tenantId: string,
  email: string,
): Promise<void> {
  await getDb()
    .delete(membershipInvites)
    .where(
      and(
        eq(membershipInvites.tenantId, tenantId),
        eq(
          membershipInvites.emailExactIndex,
          inviteEmailColumns(email).emailExactIndex,
        ),
        isNotNull(membershipInvites.consumedAt),
      ),
    );
}

export async function removeMembership(
  tenantId: string,
  membershipId: string,
  actingUserId: string,
): Promise<TMembershipRemovalOutcome> {
  const db = getDb();

  const [member] = await db
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

  const [removed] = await db
    .delete(memberships)
    .where(and(eq(memberships.id, membershipId), keepsAnotherOwner()))
    .returning({ id: memberships.id });

  if (!removed) {
    return role === MEMBERSHIP_ROLE.OWNER
      ? MEMBERSHIP_REMOVAL_OUTCOME.LAST_OWNER
      : MEMBERSHIP_REMOVAL_OUTCOME.NOT_FOUND;
  }

  const email = decryptOptionalPersonalValue(emailEncrypted);
  if (email) await clearConsumedInvite(tenantId, email);

  return MEMBERSHIP_REMOVAL_OUTCOME.REMOVED;
}
