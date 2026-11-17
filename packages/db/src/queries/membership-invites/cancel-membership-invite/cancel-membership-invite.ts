import { getDb } from '@shinefold/db/client';
import { MEMBERSHIP_ROLE } from '@shinefold/db/constants';
import { membershipInvites } from '@shinefold/db/schema/membership-invites';
import { isUuid } from '@shinefold/db/utils/is-uuid/is-uuid';
import { hasLength } from '@shinefold/utils/primitives';
import { and, eq, isNull, ne } from 'drizzle-orm';

// A pending OWNER invite is the site's only owner until it is accepted, so it is moved with the owner email, never cancelled.
export async function cancelMembershipInvite(
  tenantId: string,
  inviteId: string,
): Promise<boolean> {
  if (!isUuid(inviteId)) return false;

  const cancelled = await getDb()
    .delete(membershipInvites)
    .where(
      and(
        eq(membershipInvites.id, inviteId),
        eq(membershipInvites.tenantId, tenantId),
        isNull(membershipInvites.consumedAt),
        ne(membershipInvites.role, MEMBERSHIP_ROLE.OWNER),
      ),
    )
    .returning({ id: membershipInvites.id });

  return hasLength(cancelled);
}
