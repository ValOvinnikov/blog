import { getDb } from '@blog/db/client';
import { bookmarks, type TBookmark } from '@blog/db/schema/bookmarks';
import { and, desc, eq } from 'drizzle-orm';

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

// Removes a bookmark for (userId, postId). A no-op if it doesn't exist, so
// `BookmarkToggle`'s "remove" action can call this unconditionally.
export async function removeBookmark(
  userId: string,
  postId: string,
): Promise<void> {
  const db = getDb();

  await db
    .delete(bookmarks)
    .where(and(eq(bookmarks.userId, userId), eq(bookmarks.postId, postId)));
}

// Lists a user's saved posts, most recently bookmarked first — feeds the
// `/bookmarks` page's `PostsSection`/`PostCard` grid (the post bodies
// themselves come from `service`, joined in `web`; see .claude/agents/db.md).
export async function listBookmarks(userId: string): Promise<TBookmark[]> {
  const db = getDb();

  return db
    .select()
    .from(bookmarks)
    .where(eq(bookmarks.userId, userId))
    .orderBy(desc(bookmarks.createdAt));
}

// Whether a user has already bookmarked a post — resolves `BookmarkToggle`'s
// initial filled/outline icon state on first render.
export async function isBookmarked(
  userId: string,
  postId: string,
): Promise<boolean> {
  const db = getDb();

  const [existing] = await db
    .select({ userId: bookmarks.userId })
    .from(bookmarks)
    .where(and(eq(bookmarks.userId, userId), eq(bookmarks.postId, postId)));

  return existing !== undefined;
}
