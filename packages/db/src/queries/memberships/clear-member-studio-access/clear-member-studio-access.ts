import { getDb } from '@shinefold/db/client';
import { memberships } from '@shinefold/db/schema/memberships';
import { isUuid } from '@shinefold/db/utils/is-uuid/is-uuid';
import { hasLength } from '@shinefold/utils/primitives';
import { eq } from 'drizzle-orm';

export async function clearMemberStudioAccess(
  membershipId: string,
): Promise<boolean> {
  if (!isUuid(membershipId)) return false;

  const cleared = await getDb()
    .update(memberships)
    .set({
      sanityInviteId: null,
      sanityInviteSentAt: null,
      sanityInviteAcceptedAt: null,
      sanityUserId: null,
      sanityLoginProvider: null,
    })
    .where(eq(memberships.id, membershipId))
    .returning({ id: memberships.id });

  return hasLength(cleared);
}
