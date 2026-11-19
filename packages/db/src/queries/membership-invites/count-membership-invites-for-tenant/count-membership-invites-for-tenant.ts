import { getDb } from '@shinefold/db/client';
import { membershipInvites } from '@shinefold/db/schema/membership-invites';
import { count, eq } from 'drizzle-orm';

export async function countMembershipInvitesForTenant(
  tenantId: string,
): Promise<number> {
  const db = getDb();

  const [row] = await db
    .select({ total: count() })
    .from(membershipInvites)
    .where(eq(membershipInvites.tenantId, tenantId));

  return row?.total ?? 0;
}
