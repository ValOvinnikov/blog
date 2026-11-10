import type { TMaybeNull, TMaybeUndefined } from '@blog/config';
import { SANITY_DOCUMENT_ACTION } from '@blog/config/constants';
import { queries } from '@blog/db';
import { REVALIDATE_LOG } from '@web/constants/revalidate';
import { POST_TYPE } from '@web/server/revalidate/derive-revalidate-paths/derive-revalidate-paths';
import { logger } from '@web/utils/logger/logger';

export type TRemoveDeletedPostBookmarksInput = {
  operation: TMaybeNull<string>;
  type: string;
  id: string;
  tenantId: TMaybeUndefined<string>;
};

export const removeDeletedPostBookmarks = async ({
  operation,
  type,
  id,
  tenantId,
}: TRemoveDeletedPostBookmarksInput): Promise<number> => {
  if (
    operation !== SANITY_DOCUMENT_ACTION.DELETE ||
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
