import { getDb } from '@shinefold/db/client';
import {
  membershipsCount,
  pendingInvitesCount,
} from '@shinefold/db/queries/membership-invites/create-membership-invite/seat-limit';
import { tenants } from '@shinefold/db/schema/tenants';
import { eq, sql } from 'drizzle-orm';

export async function countSeatsInUse(tenantId: string): Promise<number> {
  const [row] = await getDb()
    .select({
      seats: sql<number>`(${membershipsCount(tenantId)} + ${pendingInvitesCount(tenantId)})::int`,
    })
    .from(tenants)
    .where(eq(tenants.id, tenantId));

  return row?.seats ?? 0;
}
