import { getDb } from '@blog/db/client';
import { bookmarks, type TBookmark } from '@blog/db/schema/bookmarks';
import { and, desc, eq } from 'drizzle-orm';

// Lists a user's saved posts within a tenant, most recently bookmarked first
// — feeds the `/bookmarks` page's `BookmarksList` organism (the post bodies
// themselves come from `service`, joined in `web`; see .claude/agents/db.md).
export async function listBookmarks(
  tenantId: string,
  userId: string,
): Promise<TBookmark[]> {
  const db = getDb();

  return db
    .select()
    .from(bookmarks)
    .where(and(eq(bookmarks.tenantId, tenantId), eq(bookmarks.userId, userId)))
    .orderBy(desc(bookmarks.createdAt));
}
