import { getDb } from '@blog/db/client';
import { bookmarks } from '@blog/db/schema/bookmarks';
import { eq } from 'drizzle-orm';

// Permanently removes every `bookmarks` row for the tenant, across every
// user — the deprovisioning `purge-reader-data` step's reader-data purge,
// unlike `removeBookmarksForPost`'s single-post scope.
export async function deleteBookmarksForTenant(
  tenantId: string,
): Promise<number> {
  const db = getDb();

  const deleted = await db
    .delete(bookmarks)
    .where(eq(bookmarks.tenantId, tenantId))
    .returning();

  return deleted.length;
}
