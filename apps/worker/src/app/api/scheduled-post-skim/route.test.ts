import { SCHEDULED_POST_SKIM_LOG } from '@worker/constants/scheduled-post-skim';
import { MOCK_WORKER_ORIGIN } from '@worker/testing/enqueue/fixtures';
import { startScheduledPostRun } from '@worker/utils/scheduled-post/start-scheduled-post-run';
import { generateScheduledPostSkim } from '@worker/workflows/generate-scheduled-post-skim';

import { POST } from './route';

vi.mock('@worker/utils/scheduled-post/start-scheduled-post-run');
vi.mock('@worker/workflows/generate-scheduled-post-skim');

describe('POST /api/scheduled-post-skim', () => {
  it("starts the post's takeaways go-live run under its own log event", async () => {
    const request = new Request(
      `${MOCK_WORKER_ORIGIN}/api/scheduled-post-skim`,
    );

    await POST(request);

    expect(startScheduledPostRun).toHaveBeenCalledExactlyOnceWith(
      request,
      generateScheduledPostSkim,
      SCHEDULED_POST_SKIM_LOG.START_FAILED,
    );
  });
});
