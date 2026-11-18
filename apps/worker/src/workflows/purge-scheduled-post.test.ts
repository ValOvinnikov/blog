import {
  SCHEDULED_POST_PURGE_HOOK_PREFIX,
  SCHEDULED_POST_PURGE_LOG,
} from '@worker/constants/scheduled-post-purge';
import { MOCK_POST_ID } from '@worker/testing/post/fixtures';
import { MOCK_PUBLISHED_AT } from '@worker/testing/scheduled-post/fixtures';
import { MOCK_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { purgeScheduledPostPages } from '@worker/units/scheduled-post-purge/purge-scheduled-post-pages';
import { runAtScheduledPostDate } from '@worker/workflows/scheduled-post-run';

import { purgeScheduledPost } from './purge-scheduled-post';

vi.mock('@worker/units/scheduled-post-purge/purge-scheduled-post-pages');
vi.mock('@worker/workflows/scheduled-post-run');

describe(purgeScheduledPost, () => {
  it("purges the post's pages once its publish date arrives", async () => {
    vi.mocked(runAtScheduledPostDate).mockImplementation(({ onDue }) =>
      onDue(),
    );

    await purgeScheduledPost(MOCK_TENANT_ID, MOCK_POST_ID, MOCK_PUBLISHED_AT);

    expect(runAtScheduledPostDate).toHaveBeenCalledWith(
      expect.objectContaining({
        hookPrefix: SCHEDULED_POST_PURGE_HOOK_PREFIX,
        runFailedEvent: SCHEDULED_POST_PURGE_LOG.RUN_FAILED,
        tenantId: MOCK_TENANT_ID,
        postId: MOCK_POST_ID,
        publishedAt: MOCK_PUBLISHED_AT,
      }),
    );
    expect(purgeScheduledPostPages).toHaveBeenCalledExactlyOnceWith(
      MOCK_TENANT_ID,
      MOCK_POST_ID,
    );
  });
});
