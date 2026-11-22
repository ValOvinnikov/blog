import { SCHEDULED_POST_PURGE_LOG } from '@worker/constants/scheduled-post-purge';
import { MOCK_WORKER_ORIGIN } from '@worker/testing/enqueue/fixtures';
import { startScheduledPostRun } from '@worker/utils/scheduled-post/start-scheduled-post-run';
import { purgeScheduledPost } from '@worker/workflows/purge-scheduled-post';

import { POST } from './route';

vi.mock('@worker/utils/scheduled-post/start-scheduled-post-run');
vi.mock('@worker/workflows/purge-scheduled-post');

describe('POST /api/scheduled-post-purge', () => {
  it("starts the scheduled post's purge run under its own log event", async () => {
    const request = new Request(
      `${MOCK_WORKER_ORIGIN}/api/scheduled-post-purge`,
    );

    await POST(request);

    expect(startScheduledPostRun).toHaveBeenCalledExactlyOnceWith(
      request,
      purgeScheduledPost,
      SCHEDULED_POST_PURGE_LOG.START_FAILED,
    );
  });
});
