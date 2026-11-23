import { getDb } from '@shinefold/db/client';
import { adminInvites } from '@shinefold/db/schema/admin-invites';
import { isUuid } from '@shinefold/db/utils/is-uuid/is-uuid';
import { hasLength } from '@shinefold/utils/primitives';
import { eq } from 'drizzle-orm';

export async function cancelAdminInvite(inviteId: string): Promise<boolean> {
  if (!isUuid(inviteId)) return false;

  const cancelled = await getDb()
    .delete(adminInvites)
    .where(eq(adminInvites.id, inviteId))
    .returning({ id: adminInvites.id });

  return hasLength(cancelled);
}
