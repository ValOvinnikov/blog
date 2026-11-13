import { getDb } from '@blog/db/client';
import {
  MEMBERSHIP_ROLE,
  PLAN_ENTITLEMENTS,
  type TTenantPlan,
} from '@blog/db/constants';
import { memberships } from '@blog/db/schema/memberships';
import { tenants } from '@blog/db/schema/tenants';
import {
  and,
  eq,
  exists,
  gt,
  inArray,
  isNotNull,
  isNull,
  lte,
  type SQL,
  sql,
} from 'drizzle-orm';

function rankedMemberships(tenantId: string) {
  return getDb()
    .select({
      id: memberships.id,
      lockedAt: memberships.lockedAt,
      seat: sql<number>`row_number() over (order by ${memberships.role} = ${MEMBERSHIP_ROLE.OWNER} desc, ${memberships.createdAt}, ${memberships.id})`.as(
        'seat',
      ),
    })
    .from(memberships)
    .where(eq(memberships.tenantId, tenantId))
    .as('ranked');
}

export function unlockedMembershipsOverSeats(tenantId: string, seats: number) {
  const ranked = rankedMemberships(tenantId);

  return getDb()
    .select({ id: ranked.id })
    .from(ranked)
    .where(and(gt(ranked.seat, seats), isNull(ranked.lockedAt)));
}

function lockedMembershipsWithinSeats(tenantId: string, seats: number) {
  const ranked = rankedMemberships(tenantId);

  return getDb()
    .select({ id: ranked.id })
    .from(ranked)
    .where(and(lte(ranked.seat, seats), isNotNull(ranked.lockedAt)));
}

export function unlockMembershipsWithinPlan(
  tenantId: string,
  plan: TTenantPlan,
  whenTenant: SQL = sql`true`,
) {
  const db = getDb();
  const tenantMatches = exists(
    db
      .select({ id: tenants.id })
      .from(tenants)
      .where(and(eq(tenants.id, tenantId), whenTenant)),
  );

  return db.$with('unlocked_memberships').as(
    db
      .update(memberships)
      .set({ lockedAt: null })
      .where(
        and(
          tenantMatches,
          inArray(
            memberships.id,
            lockedMembershipsWithinSeats(
              tenantId,
              PLAN_ENTITLEMENTS[plan].seats,
            ),
          ),
        ),
      )
      .returning({ id: memberships.id }),
  );
}
