import type { TMaybeUndefined } from '@blog/config';
import { getDb } from '@blog/db/client';
import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import { users } from '@blog/db/schema/auth';
import { membershipInvites } from '@blog/db/schema/membership-invites';
import { memberships } from '@blog/db/schema/memberships';
import {
  decryptOptionalPersonalValue,
  decryptPersonalValue,
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
      emailEncrypted: users.emailEncrypted,
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
  if (owner) {
    const { emailEncrypted, createdAt, hasSignedIn } = owner;
    const email = decryptOptionalPersonalValue(emailEncrypted);
    if (email) {
      return hasSignedIn
        ? { email, hasSignedIn, joinedAt: createdAt }
        : { email, hasSignedIn, invitedAt: createdAt };
    }
  }

  const [invite] = await db
    .select({
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

  const { emailEncrypted, createdAt } = invite;
  return {
    email: decryptPersonalValue(emailEncrypted),
    hasSignedIn: false,
    invitedAt: createdAt,
  };
}
