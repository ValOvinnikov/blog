import { getDb } from '@blog/db/client';
import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import { users } from '@blog/db/schema/auth';
import { membershipInvites } from '@blog/db/schema/membership-invites';
import { memberships } from '@blog/db/schema/memberships';
import { and, eq, isNull } from 'drizzle-orm';

// A tenant has at most one OWNER membership (set once at draft-creation
// time — see `createTenantDraft`), so this never needs to disambiguate
// multiple owners. The owner grant is a `memberships` row only once that
// email has signed into the admin app at least once; until then it's a
// still-pending `membershipInvites` row (see `createTenantDraft`'s
// `TDraftOwner` union) — a brand-new tenant's owner is almost always in
// that state, so a caller resolving who to notify (e.g. the Sanity Studio
// invite) must fall back to it rather than treat "no memberships row" alone
// as "no owner".
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
  if (owner?.email) return owner.email;

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

  return invite?.email ?? undefined;
}
