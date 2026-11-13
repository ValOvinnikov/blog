import { getDb } from '@blog/db/client';
import {
  MEMBERSHIP_ROLE,
  PLAN_ENTITLEMENTS,
  type TTenantPlan,
} from '@blog/db/constants';
import { unlockedMembershipsCount } from '@blog/db/queries/membership-invites/create-membership-invite/seat-limit';
import { isTenantOnPlan } from '@blog/db/queries/tenants/tenant-on-plan';
import { membershipInvites } from '@blog/db/schema/membership-invites';
import { and, eq, gt, inArray, isNull, ne, sql } from 'drizzle-orm';

export async function stopPendingInvitesOverSeats(
  tenantId: string,
  plan: TTenantPlan,
): Promise<number> {
  const db = getDb();
  const { seats } = PLAN_ENTITLEMENTS[plan];
  const ranked = db
    .select({
      id: membershipInvites.id,
      rank: sql<number>`row_number() over (order by ${membershipInvites.createdAt}, ${membershipInvites.id})`.as(
        'rank',
      ),
    })
    .from(membershipInvites)
    .where(
      and(
        eq(membershipInvites.tenantId, tenantId),
        isNull(membershipInvites.consumedAt),
        ne(membershipInvites.role, MEMBERSHIP_ROLE.OWNER),
      ),
    )
    .as('ranked');

  const stopped = await db
    .delete(membershipInvites)
    .where(
      and(
        isTenantOnPlan(tenantId, plan),
        inArray(
          membershipInvites.id,
          db
            .select({ id: ranked.id })
            .from(ranked)
            .where(
              gt(
                ranked.rank,
                sql`greatest(${seats} - ${unlockedMembershipsCount(tenantId)}, 0)`,
              ),
            ),
        ),
      ),
    )
    .returning({ id: membershipInvites.id });

  return stopped.length;
}
