import { getDb } from '@blog/db/client';
import { membershipInvites } from '@blog/db/schema/membership-invites';
import { eq } from 'drizzle-orm';

// Permanently removes every `membership_invites` row for the tenant,
// pending or already consumed — the deprovisioning `purge-reader-data`
// step's reader-data purge. Leaves `memberships` itself untouched: that
// table is the record of who owned and ran the site, out of scope for this
// purge.
export async function deleteMembershipInvitesForTenant(
  tenantId: string,
): Promise<number> {
  const db = getDb();

  const deleted = await db
    .delete(membershipInvites)
    .where(eq(membershipInvites.tenantId, tenantId))
    .returning();

  return deleted.length;
}
