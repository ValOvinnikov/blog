'use server';

import { queries } from '@blog/db';
import { auth } from '@web/server/auth/auth';
import { getSoleTenantId } from '@web/server/site-config/get-site-config';
import { sanitizeLogMessage } from '@web/utils/sanitize-log-message';

export type TSetBookmarkResult = { ok: true } | { ok: false };

/**
 * getBookmarkStatus — resolves whether the signed-in reader has already
 * bookmarked `postId`, for `BookmarkButton`'s initial render once it knows
 * the session is authenticated. Never throws for a signed-out session (just
 * resolves `false`) so the caller doesn't need its own auth branch before
 * calling this.
 */
export async function getBookmarkStatus(postId: string): Promise<boolean> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return false;

  const tenantId = await getSoleTenantId();
  if (!tenantId) return false;

  return queries.bookmarks.isBookmarked(tenantId, userId, postId);
}

/**
 * setBookmarkStatus — the session-gated bookmark write `BookmarkButton`
 * calls right after flipping its own optimistic state. `addBookmark`/
 * `removeBookmark` are both idempotent (see `@blog/db`'s query docs), so
 * this never needs to check the current state first — it just applies the
 * caller's desired `isBookmarked` value. A `{ ok: false }` result (no
 * session, or the write throws) tells the caller to roll the toggle back
 * and show a transient error.
 */
export async function setBookmarkStatus(
  postId: string,
  isBookmarked: boolean,
): Promise<TSetBookmarkResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false };

  const tenantId = await getSoleTenantId();
  if (!tenantId) return { ok: false };

  try {
    if (isBookmarked) {
      await queries.bookmarks.addBookmark(tenantId, userId, postId);
    } else {
      await queries.bookmarks.removeBookmark(tenantId, userId, postId);
    }
    return { ok: true };
  } catch (error) {
    console.error('Failed to update bookmark:', sanitizeLogMessage(error));
    return { ok: false };
  }
}
