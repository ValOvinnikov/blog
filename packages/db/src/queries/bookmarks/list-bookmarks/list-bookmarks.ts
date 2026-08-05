import { getDb } from '@blog/db/client';
import { bookmarks, type TBookmark } from '@blog/db/schema/bookmarks';
import { desc, eq } from 'drizzle-orm';

// Lists a user's saved posts, most recently bookmarked first — feeds the
// `/bookmarks` page's `BookmarksList` organism (the post bodies themselves
// come from `service`, joined in `web`; see .claude/agents/db.md).
export async function listBookmarks(userId: string): Promise<TBookmark[]> {
  const db = getDb();

  return db
    .select()
    .from(bookmarks)
    .where(eq(bookmarks.userId, userId))
    .orderBy(desc(bookmarks.createdAt));
}
