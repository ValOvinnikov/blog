import { getDb } from '@blog/db/client';
import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import { users } from '@blog/db/schema/auth';
import { memberships } from '@blog/db/schema/memberships';
import { and, eq } from 'drizzle-orm';

export type TTenantOwnerMembership = {
  email: string;
  joinedAt: Date;
};

// A pending `membershipInvites` row has no join date (the invite hasn't been
// accepted yet), so this intentionally has no invite fallback — callers use
// `getTenantOwnerEmail` for that case and treat `undefined` here as
// "still pending, show the invited badge instead".
export async function getTenantOwnerMembership(
  tenantId: string,
): Promise<TTenantOwnerMembership | undefined> {
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

  if (!owner?.email) return undefined;

  return { email: owner.email, joinedAt: owner.joinedAt };
}
