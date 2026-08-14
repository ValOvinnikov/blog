import { getDb } from '@blog/db/client';
import { bookmarks } from '@blog/db/schema/bookmarks';
import { and, eq } from 'drizzle-orm';

// Whether a user has already bookmarked a post — resolves `BookmarkToggle`'s
// initial filled/outline icon state on first render.
export async function isBookmarked(
  tenantId: string,
  userId: string,
  postId: string,
): Promise<boolean> {
  const db = getDb();

  const [existing] = await db
    .select({ userId: bookmarks.userId })
    .from(bookmarks)
    .where(
      and(
        eq(bookmarks.tenantId, tenantId),
        eq(bookmarks.userId, userId),
        eq(bookmarks.postId, postId),
      ),
    );

  return existing !== undefined;
}
