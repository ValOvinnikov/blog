import {
  SCHEDULED_POST_PURGE_TIMEOUT_MS,
  WEB_SCHEDULED_POST_PURGE_PATH,
} from '@worker/constants/scheduled-post-purge';
import { postScheduledPostToWeb } from '@worker/utils/scheduled-post/post-to-web';

export async function purgeScheduledPostPages(
  tenantId: string,
  postId: string,
): Promise<void> {
  'use step';

  await postScheduledPostToWeb({
    path: WEB_SCHEDULED_POST_PURGE_PATH,
    body: { tenantId, postId },
    timeoutMs: SCHEDULED_POST_PURGE_TIMEOUT_MS,
    action: 'purge a scheduled post',
  });
}
