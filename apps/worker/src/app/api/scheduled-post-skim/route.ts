import { SCHEDULED_POST_SKIM_LOG } from '@worker/constants/scheduled-post-skim';
import { startScheduledPostRun } from '@worker/utils/scheduled-post/start-scheduled-post-run';
import { generateScheduledPostSkim } from '@worker/workflows/generate-scheduled-post-skim';

export async function POST(request: Request): Promise<Response> {
  return startScheduledPostRun(
    request,
    generateScheduledPostSkim,
    SCHEDULED_POST_SKIM_LOG.START_FAILED,
  );
}
