'use server';

import { queries } from '@blog/db';
import { auth } from '@web/server/auth/auth';
import { getRequestTenantId } from '@web/server/tenant/get-request-tenant-id';
import { isTenantActive } from '@web/server/tenant/is-tenant-active';
import { logger } from '@web/utils/logger/logger';

export type TSetBookmarkResult = { ok: true } | { ok: false };

export const getBookmarkStatus = async (postId: string): Promise<boolean> => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return false;

  const tenantId = await getRequestTenantId();
  if (!tenantId) return false;

  return queries.bookmarks.isBookmarked(tenantId, userId, postId);
};

export const setBookmarkStatus = async (
  postId: string,
  isBookmarked: boolean,
): Promise<TSetBookmarkResult> => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false };

  const tenantId = await getRequestTenantId();
  if (!tenantId) return { ok: false };

  if (!(await isTenantActive(tenantId))) {
    logger.warn('bookmark.tenant_not_active', { postId, tenantId });
    return { ok: false };
  }

  try {
    if (isBookmarked) {
      const result = await queries.bookmarks.addBookmark(
        tenantId,
        userId,
        postId,
      );
      if (!result.ok) {
        logger.error('bookmark.update_failed', {
          postId,
          error: result.error,
        });
        return { ok: false };
      }
    } else {
      await queries.bookmarks.removeBookmark(tenantId, userId, postId);
    }
    return { ok: true };
  } catch (error) {
    logger.error('bookmark.update_failed', { postId, error });
    return { ok: false };
  }
};
