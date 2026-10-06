import { getDb } from '@blog/db/client';
import { bookmarks } from '@blog/db/schema/bookmarks';
import { eq } from 'drizzle-orm';

export async function countBookmarksForTenant(
  tenantId: string,
): Promise<number> {
  const db = getDb();

  const rows = await db
    .select({ postId: bookmarks.postId })
    .from(bookmarks)
    .where(eq(bookmarks.tenantId, tenantId));

  return rows.length;
}
