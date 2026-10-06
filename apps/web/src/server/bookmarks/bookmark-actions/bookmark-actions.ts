'use server';

import { TENANT_WRITE_REFUSAL } from '@blog/config';
import { queries } from '@blog/db';
import { auth } from '@web/server/auth/auth';
import { getRequestTenantId } from '@web/server/tenant/request-tenant/request-tenant';
import { resolveWritableTenant } from '@web/server/tenant/write-gate/write-gate';
import { logger } from '@web/utils/logger/logger';

export type TSetBookmarkResult =
  { ok: true } | { ok: false; isUnavailable: boolean };

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
  if (!userId) return { ok: false, isUnavailable: false };

  const tenant = await resolveWritableTenant('bookmark.set');
  if (!tenant.ok) {
    const isUnavailable = tenant.reason === TENANT_WRITE_REFUSAL.INACTIVE;
    if (isUnavailable) {
      logger.warn('bookmark.tenant_not_active', { postId });
    }
    return { ok: false, isUnavailable };
  }
  const { tenantId } = tenant;

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
        return { ok: false, isUnavailable: false };
      }
    } else {
      await queries.bookmarks.removeBookmark(tenantId, userId, postId);
    }
    return { ok: true };
  } catch (error) {
    logger.error('bookmark.update_failed', { postId, error });
    return { ok: false, isUnavailable: false };
  }
};
