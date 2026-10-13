import type { TMaybeUndefined } from '@blog/config';
import { getDb } from '@blog/db/client';
import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import { users } from '@blog/db/schema/auth';
import { membershipInvites } from '@blog/db/schema/membership-invites';
import { memberships } from '@blog/db/schema/memberships';
import { and, eq, isNull } from 'drizzle-orm';

export type TTenantOwnerMembership = {
  email: string;
  joinedAt?: Date;
};

// Until the owner first signs in, their grant is a pending invite rather than a membership.
export async function getTenantOwnerMembership(
  tenantId: string,
): Promise<TMaybeUndefined<TTenantOwnerMembership>> {
  const db = getDb();

  const [owner] = await db
    .select({ email: users.email, joinedAt: memberships.createdAt })
    .from(memberships)
    .innerJoin(users, eq(memberships.userId, users.id))
    .where(
      and(
        eq(memberships.tenantId, tenantId),
        eq(memberships.role, MEMBERSHIP_ROLE.OWNER),
      ),
    );
  if (owner?.email) return { email: owner.email, joinedAt: owner.joinedAt };

  const [invite] = await db
    .select({ email: membershipInvites.email })
    .from(membershipInvites)
    .where(
      and(
        eq(membershipInvites.tenantId, tenantId),
        eq(membershipInvites.role, MEMBERSHIP_ROLE.OWNER),
        isNull(membershipInvites.consumedAt),
      ),
    );

  return invite ? { email: invite.email } : undefined;
}
