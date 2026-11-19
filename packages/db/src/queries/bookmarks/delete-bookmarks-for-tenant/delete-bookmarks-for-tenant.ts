import { getDb } from '@shinefold/db/client';
import { bookmarks } from '@shinefold/db/schema/bookmarks';
import { eq } from 'drizzle-orm';

export async function deleteBookmarksForTenant(
  tenantId: string,
): Promise<number> {
  const db = getDb();

  const deleted = await db
    .delete(bookmarks)
    .where(eq(bookmarks.tenantId, tenantId))
    .returning({ postId: bookmarks.postId });

  return deleted.length;
}
