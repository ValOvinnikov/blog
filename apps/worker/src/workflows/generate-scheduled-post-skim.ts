import {
  SCHEDULED_POST_SKIM_HOOK_PREFIX,
  SCHEDULED_POST_SKIM_LOG,
} from '@worker/constants/scheduled-post-skim';
import { requestScheduledPostSkim } from '@worker/units/scheduled-post-skim/request-scheduled-post-skim';
import { runAtScheduledPostDate } from '@worker/workflows/scheduled-post-run';

export async function generateScheduledPostSkim(
  tenantId: string,
  postId: string,
  publishedAt: string,
): Promise<void> {
  'use workflow';

  await runAtScheduledPostDate({
    hookPrefix: SCHEDULED_POST_SKIM_HOOK_PREFIX,
    runFailedEvent: SCHEDULED_POST_SKIM_LOG.RUN_FAILED,
    tenantId,
    postId,
    publishedAt,
    onDue: () => requestScheduledPostSkim(tenantId, postId, publishedAt),
  });
}
