import { SCHEDULED_POST_PURGE_LOG } from '@worker/constants/scheduled-post-purge';
import { startScheduledPostRun } from '@worker/utils/scheduled-post/start-scheduled-post-run';
import { purgeScheduledPost } from '@worker/workflows/purge-scheduled-post';

export async function POST(request: Request): Promise<Response> {
  return startScheduledPostRun(
    request,
    purgeScheduledPost,
    SCHEDULED_POST_PURGE_LOG.START_FAILED,
  );
}
