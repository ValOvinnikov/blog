import { getDb } from '@blog/db/client';
import { bookmarks } from '@blog/db/schema/bookmarks';
import { and, eq } from 'drizzle-orm';

// System-wide cleanup for a deleted/unpublished Sanity post — deletes every
// user's bookmark for (tenantId, postId), unlike `removeBookmark`'s single
// (tenantId, userId, postId) tuple. Scoped by tenantId too: `postId` is a
// Sanity `_id` unique only within one tenant's dataset, so a bare `postId`
// filter could delete an unrelated tenant's bookmarks.
export async function removeBookmarksForPost(
  tenantId: string,
  postId: string,
): Promise<number> {
  const db = getDb();

  const deleted = await db
    .delete(bookmarks)
    .where(and(eq(bookmarks.tenantId, tenantId), eq(bookmarks.postId, postId)))
    .returning();

  return deleted.length;
}
