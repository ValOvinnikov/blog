import { getDb } from '@blog/db/client';
import { PLAN_ENTITLEMENTS } from '@blog/db/constants';
import { membershipInvites } from '@blog/db/schema/membership-invites';
import { memberships } from '@blog/db/schema/memberships';
import { tenants } from '@blog/db/schema/tenants';
import { hasLength } from '@blog/utils/primitives';
import { and, eq, isNull, type SQL, sql, type SQLWrapper } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

export function planSeats(): SQL<number> {
  const cases = Object.entries(PLAN_ENTITLEMENTS).map(
    ([plan, { seats }]) => sql`when ${plan} then ${seats}::int`,
  );

  return sql<number>`case ${tenants.plan} ${sql.join(cases, sql` `)} end`;
}

export function membershipsCount(tenantId: SQLWrapper | string): SQL<number> {
  return sql<number>`(select count(*) from ${memberships} where ${eq(memberships.tenantId, tenantId)})`;
}

export function pendingInvitesCount(tenantId: string): SQL<number> {
  return sql<number>`(select count(*) from ${membershipInvites}
    where ${and(eq(membershipInvites.tenantId, tenantId), isNull(membershipInvites.consumedAt))})`;
}

// Two concurrent invites can both pass the insert's count, so each re-counts
// in a fresh statement and removes itself while the tenant is over its seats;
// a race may refuse both, never keep both.
export async function releaseInvitePastSeatLimit(
  inviteId: string,
): Promise<boolean> {
  const pending = alias(membershipInvites, 'pending');

  const released = await getDb()
    .delete(membershipInvites)
    .where(
      and(
        eq(membershipInvites.id, inviteId),
        sql`${membershipsCount(membershipInvites.tenantId)}
          + (select count(*) from ${membershipInvites} ${pending}
             where ${and(eq(pending.tenantId, membershipInvites.tenantId), isNull(pending.consumedAt))})
          > (select ${planSeats()} from ${tenants} where ${eq(tenants.id, membershipInvites.tenantId)})`,
      ),
    )
    .returning({ id: membershipInvites.id });

  return hasLength(released);
}
