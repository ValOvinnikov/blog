import {
  SCHEDULED_POST_SKIM_MAX_RETRIES,
  SCHEDULED_POST_SKIM_TIMEOUT_MS,
  WEB_SCHEDULED_POST_SKIM_PATH,
} from '@worker/constants/scheduled-post-skim';
import { postScheduledPostToWeb } from '@worker/utils/scheduled-post/post-to-web';

export async function requestScheduledPostSkim(
  tenantId: string,
  postId: string,
  publishedAt: string,
): Promise<void> {
  'use step';

  await postScheduledPostToWeb({
    path: WEB_SCHEDULED_POST_SKIM_PATH,
    body: { tenantId, postId, publishedAt },
    timeoutMs: SCHEDULED_POST_SKIM_TIMEOUT_MS,
    action: 'generate takeaways for a scheduled post',
  });
}

requestScheduledPostSkim.maxRetries = SCHEDULED_POST_SKIM_MAX_RETRIES;
