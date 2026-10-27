import type { TMaybeUndefined } from '@blog/config';
import { getDb } from '@blog/db/client';
import { MEMBERSHIP_ROLE, PERSONAL_DATA_OWNER } from '@blog/db/constants';
import { users } from '@blog/db/schema/auth';
import { membershipInvites } from '@blog/db/schema/membership-invites';
import { memberships } from '@blog/db/schema/memberships';
import {
  readPersonalValue,
  reportPlainPersonalRead,
} from '@blog/db/utils/personal-data/personal-data';
import { userHasSignedIn } from '@blog/db/utils/user-has-signed-in/user-has-signed-in';
import { and, eq, isNull } from 'drizzle-orm';

export type TTenantOwnerMembership =
  | { email: string; hasSignedIn: true; joinedAt: Date }
  | { email: string; hasSignedIn: false; invitedAt: Date };

// Until the owner first signs in, their grant is a pending invite, or a membership made for an account that has never signed in.
export async function getTenantOwnerMembership(
  tenantId: string,
): Promise<TMaybeUndefined<TTenantOwnerMembership>> {
  const db = getDb();

  const [owner] = await db
    .select({
      email: users.email,
      createdAt: memberships.createdAt,
      hasSignedIn: userHasSignedIn(),
    })
    .from(memberships)
    .innerJoin(users, eq(memberships.userId, users.id))
    .where(
      and(
        eq(memberships.tenantId, tenantId),
        eq(memberships.role, MEMBERSHIP_ROLE.OWNER),
      ),
    );
  if (owner?.email) {
    const { email, createdAt, hasSignedIn } = owner;
    return hasSignedIn
      ? { email, hasSignedIn, joinedAt: createdAt }
      : { email, hasSignedIn, invitedAt: createdAt };
  }

  const [invite] = await db
    .select({
      email: membershipInvites.email,
      emailEncrypted: membershipInvites.emailEncrypted,
      createdAt: membershipInvites.createdAt,
    })
    .from(membershipInvites)
    .where(
      and(
        eq(membershipInvites.tenantId, tenantId),
        eq(membershipInvites.role, MEMBERSHIP_ROLE.OWNER),
        isNull(membershipInvites.consumedAt),
      ),
    );

  if (!invite) return undefined;

  const { email, emailEncrypted, createdAt } = invite;
  reportPlainPersonalRead(PERSONAL_DATA_OWNER.INVITE, emailEncrypted);
  return {
    email: readPersonalValue(emailEncrypted, email),
    hasSignedIn: false,
    invitedAt: createdAt,
  };
}
