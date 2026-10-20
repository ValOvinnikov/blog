'use server';

import {
  ACTION_OUTCOME,
  TENANT_WRITE_REFUSAL,
  type TActionResult,
} from '@blog/config';
import { queries } from '@blog/db';
import { toOutcome } from '@blog/utils/to-outcome';
import { auth } from '@web/server/auth/auth';
import { getRequestTenantId } from '@web/server/tenant/request-tenant/request-tenant';
import { resolveWritableTenant } from '@web/server/tenant/write-gate/write-gate';
import { logger } from '@web/utils/logger/logger';

export type TSetBookmarkResult = TActionResult<
  typeof ACTION_OUTCOME.UNAVAILABLE | typeof ACTION_OUTCOME.SERVER_ERROR
>;

const SERVER_ERROR = toOutcome(ACTION_OUTCOME.SERVER_ERROR);

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
  if (!userId) return SERVER_ERROR;

  const tenant = await resolveWritableTenant('bookmark.set');
  if (!tenant.ok) {
    if (tenant.reason === TENANT_WRITE_REFUSAL.INACTIVE) {
      logger.warn('bookmark.tenant_not_active', { postId });
      return toOutcome(ACTION_OUTCOME.UNAVAILABLE);
    }
    return SERVER_ERROR;
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
        return SERVER_ERROR;
      }
    } else {
      await queries.bookmarks.removeBookmark(tenantId, userId, postId);
    }
    return toOutcome(ACTION_OUTCOME.SUCCESS);
  } catch (error) {
    logger.error('bookmark.update_failed', { postId, error });
    return SERVER_ERROR;
  }
};
