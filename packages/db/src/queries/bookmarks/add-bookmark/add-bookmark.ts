import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { bookmarks, type TBookmark } from '@blog/db/schema/bookmarks';
import type { TResult } from '@blog/utils';
import { and, eq } from 'drizzle-orm';

// Adds a bookmark for (tenantId, userId, postId). Idempotent: if the tuple
// already exists (the composite primary key), this returns the existing row
// instead of failing — so `BookmarkToggle`'s "save" action never needs a
// separate existence check before calling it.
export async function addBookmark(
  tenantId: string,
  userId: string,
  postId: string,
): Promise<TResult<TBookmark, TErrorCode>> {
  const db = getDb();

  const [inserted] = await db
    .insert(bookmarks)
    .values({ tenantId, userId, postId })
    .onConflictDoNothing()
    .returning();

  if (inserted) return { ok: true, data: inserted };

  const [existing] = await db
    .select()
    .from(bookmarks)
    .where(
      and(
        eq(bookmarks.tenantId, tenantId),
        eq(bookmarks.userId, userId),
        eq(bookmarks.postId, postId),
      ),
    );

  if (!existing) {
    // A real, if narrow, race: the insert only no-ops on a (tenantId,
    // userId, postId) conflict, but `removeBookmark` can delete that exact
    // row between the failed insert and this read (a rapid save/remove
    // double-click, or two tabs).
    return { ok: false, error: ERROR_CODE.DB_NOT_FOUND };
  }

  return { ok: true, data: existing };
}
