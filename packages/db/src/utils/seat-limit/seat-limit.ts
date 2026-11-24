import { PLAN_ENTITLEMENTS } from '@shinefold/db/constants';
import { membershipInvites } from '@shinefold/db/schema/membership-invites';
import { memberships } from '@shinefold/db/schema/memberships';
import { tenants } from '@shinefold/db/schema/tenants';
import { and, eq, isNull, type SQL, sql, type SQLWrapper } from 'drizzle-orm';

export function planSeats(): SQL<number> {
  const cases = Object.entries(PLAN_ENTITLEMENTS).map(
    ([plan, { seats }]) => sql`when ${plan} then ${seats}::int`,
  );

  return sql<number>`case ${tenants.plan} ${sql.join(cases, sql` `)} end`;
}

export function membershipsCount(tenantId: SQLWrapper | string): SQL<number> {
  return sql<number>`(select count(*) from ${memberships} where ${eq(memberships.tenantId, tenantId)})`;
}

export function unlockedMembershipsCount(
  tenantId: SQLWrapper | string,
): SQL<number> {
  return sql<number>`(select count(*) from ${memberships} where ${and(eq(memberships.tenantId, tenantId), isNull(memberships.lockedAt))})`;
}

function pendingInvitesCount(tenantId: SQLWrapper | string): SQL<number> {
  return sql<number>`(select count(*) from ${membershipInvites}
    where ${and(eq(membershipInvites.tenantId, tenantId), isNull(membershipInvites.consumedAt))})`;
}

export function seatsInUse(tenantId: SQLWrapper | string): SQL<number> {
  return sql<number>`(${membershipsCount(tenantId)} + ${pendingInvitesCount(tenantId)})::int`;
}
