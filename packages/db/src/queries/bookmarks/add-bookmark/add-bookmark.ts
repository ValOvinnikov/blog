import { getDb } from '@blog/db/client';
import { bookmarks, type TBookmark } from '@blog/db/schema/bookmarks';
import { and, eq } from 'drizzle-orm';

// Adds a bookmark for (userId, postId). Idempotent: if the pair already
// exists (the composite primary key), this returns the existing row instead
// of throwing — so `BookmarkToggle`'s "save" action never needs a separate
// existence check before calling it.
export async function addBookmark(
  userId: string,
  postId: string,
): Promise<TBookmark> {
  const db = getDb();

  const [inserted] = await db
    .insert(bookmarks)
    .values({ userId, postId })
    .onConflictDoNothing()
    .returning();

  if (inserted) return inserted;

  const [existing] = await db
    .select()
    .from(bookmarks)
    .where(and(eq(bookmarks.userId, userId), eq(bookmarks.postId, postId)));

  if (!existing) {
    // Unreachable in practice: the insert only no-ops on a (userId, postId)
    // conflict, which means a row satisfying this exact where already
    // exists. Thrown rather than silently returning undefined so a real
    // regression here surfaces immediately instead of as a confusing
    // downstream `undefined`.
    throw new Error(
      `addBookmark: expected an existing row for user "${userId}" / post "${postId}" after a no-op insert.`,
    );
  }

  return existing;
}
