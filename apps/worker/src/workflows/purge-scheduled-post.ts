import {
  SCHEDULED_POST_PURGE_HOOK_PREFIX,
  SCHEDULED_POST_PURGE_LOG,
} from '@worker/constants/scheduled-post-purge';
import { purgeScheduledPostPages } from '@worker/units/scheduled-post-purge/purge-scheduled-post-pages';
import { runAtScheduledPostDate } from '@worker/workflows/scheduled-post-run';

export async function purgeScheduledPost(
  tenantId: string,
  postId: string,
  publishedAt: string,
): Promise<void> {
  'use workflow';

  await runAtScheduledPostDate({
    hookPrefix: SCHEDULED_POST_PURGE_HOOK_PREFIX,
    runFailedEvent: SCHEDULED_POST_PURGE_LOG.RUN_FAILED,
    tenantId,
    postId,
    publishedAt,
    onDue: () => purgeScheduledPostPages(tenantId, postId),
  });
}
