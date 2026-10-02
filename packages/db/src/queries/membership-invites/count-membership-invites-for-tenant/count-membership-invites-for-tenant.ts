import { getDb } from '@blog/db/client';
import { membershipInvites } from '@blog/db/schema/membership-invites';
import { eq } from 'drizzle-orm';

export async function countMembershipInvitesForTenant(
  tenantId: string,
): Promise<number> {
  const db = getDb();

  const rows = await db
    .select({ id: membershipInvites.id })
    .from(membershipInvites)
    .where(eq(membershipInvites.tenantId, tenantId));

  return rows.length;
}
