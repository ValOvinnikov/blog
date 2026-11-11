import { SANITY_WEBHOOK_OPERATION } from '@blog/config/constants';
import { queries } from '@blog/db';
import { REVALIDATE_LOG } from '@web/constants/revalidate';
import { POST_TYPE } from '@web/server/revalidate/derive-revalidate-paths/derive-revalidate-paths';
import type { TPostWebhookEvent } from '@web/server/revalidate/post-webhook-event/post-webhook-event';
import { logger } from '@web/utils/logger/logger';

export const removeDeletedPostBookmarks = async ({
  operation,
  type,
  id,
  tenantId,
}: TPostWebhookEvent): Promise<number> => {
  if (
    operation !== SANITY_WEBHOOK_OPERATION.DELETE ||
    type !== POST_TYPE ||
    !tenantId
  ) {
    return 0;
  }

  try {
    return await queries.bookmarks.removeBookmarksForPost(tenantId, id);
  } catch (error) {
    logger.error(REVALIDATE_LOG.BOOKMARK_CLEANUP_FAILED, { type, id, error });
    return 0;
  }
};
