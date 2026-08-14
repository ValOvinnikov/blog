import { getDb } from '@blog/db/client';
import { bookmarks } from '@blog/db/schema/bookmarks';
import { and, eq } from 'drizzle-orm';

// Removes a bookmark for (tenantId, userId, postId). A no-op if it doesn't
// exist, so `BookmarkToggle`'s "remove" action can call this unconditionally.
export async function removeBookmark(
  tenantId: string,
  userId: string,
  postId: string,
): Promise<void> {
  const db = getDb();

  await db
    .delete(bookmarks)
    .where(
      and(
        eq(bookmarks.tenantId, tenantId),
        eq(bookmarks.userId, userId),
        eq(bookmarks.postId, postId),
      ),
    );
}
