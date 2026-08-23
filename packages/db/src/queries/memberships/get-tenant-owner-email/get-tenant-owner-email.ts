import { getDb } from '@blog/db/client';
import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import { users } from '@blog/db/schema/auth';
import { memberships } from '@blog/db/schema/memberships';
import { and, eq } from 'drizzle-orm';

// A tenant has at most one OWNER membership (set once at draft-creation
// time — see `createTenantDraft`), so this never needs to disambiguate
// multiple owners.
export async function getTenantOwnerEmail(
  tenantId: string,
): Promise<string | undefined> {
  const db = getDb();

  const [owner] = await db
    .select({ email: users.email })
    .from(memberships)
    .innerJoin(users, eq(memberships.userId, users.id))
    .where(
      and(
        eq(memberships.tenantId, tenantId),
        eq(memberships.role, MEMBERSHIP_ROLE.OWNER),
      ),
    );

  return owner?.email ?? undefined;
}
