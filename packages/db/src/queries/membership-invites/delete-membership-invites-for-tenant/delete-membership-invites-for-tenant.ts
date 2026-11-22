import { getDb } from '@shinefold/db/client';
import { membershipInvites } from '@shinefold/db/schema/membership-invites';
import { eq } from 'drizzle-orm';

export async function deleteMembershipInvitesForTenant(
  tenantId: string,
): Promise<number> {
  const db = getDb();

  const deleted = await db
    .delete(membershipInvites)
    .where(eq(membershipInvites.tenantId, tenantId))
    .returning({ id: membershipInvites.id });

  return deleted.length;
}
