import { getDb } from '@shinefold/db/client';
import { membershipInvites } from '@shinefold/db/schema/membership-invites';
import { tenants } from '@shinefold/db/schema/tenants';
import {
  membershipsCount,
  planSeats,
} from '@shinefold/db/utils/seat-limit/seat-limit';
import { hasLength } from '@shinefold/utils/primitives';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

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
