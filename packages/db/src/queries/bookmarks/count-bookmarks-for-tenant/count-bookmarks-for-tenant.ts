import { getDb } from '@shinefold/db/client';
import { bookmarks } from '@shinefold/db/schema/bookmarks';
import { count, eq } from 'drizzle-orm';

export async function countBookmarksForTenant(
  tenantId: string,
): Promise<number> {
  const db = getDb();

  const [row] = await db
    .select({ total: count() })
    .from(bookmarks)
    .where(eq(bookmarks.tenantId, tenantId));

  return row?.total ?? 0;
}
