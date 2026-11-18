import {
  SCHEDULED_POST_SKIM_HOOK_PREFIX,
  SCHEDULED_POST_SKIM_LOG,
} from '@worker/constants/scheduled-post-skim';
import { MOCK_POST_ID } from '@worker/testing/post/fixtures';
import { MOCK_PUBLISHED_AT } from '@worker/testing/scheduled-post/fixtures';
import { MOCK_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { requestScheduledPostSkim } from '@worker/units/scheduled-post-skim/request-scheduled-post-skim';
import { runAtScheduledPostDate } from '@worker/workflows/scheduled-post-run';

import { generateScheduledPostSkim } from './generate-scheduled-post-skim';

vi.mock('@worker/units/scheduled-post-skim/request-scheduled-post-skim');
vi.mock('@worker/workflows/scheduled-post-run');

describe(generateScheduledPostSkim, () => {
  it("requests the post's takeaways once its go-live date arrives", async () => {
    vi.mocked(runAtScheduledPostDate).mockImplementation(({ onDue }) =>
      onDue(),
    );

    await generateScheduledPostSkim(
      MOCK_TENANT_ID,
      MOCK_POST_ID,
      MOCK_PUBLISHED_AT,
    );

    expect(runAtScheduledPostDate).toHaveBeenCalledWith(
      expect.objectContaining({
        hookPrefix: SCHEDULED_POST_SKIM_HOOK_PREFIX,
        runFailedEvent: SCHEDULED_POST_SKIM_LOG.RUN_FAILED,
        tenantId: MOCK_TENANT_ID,
        postId: MOCK_POST_ID,
        publishedAt: MOCK_PUBLISHED_AT,
      }),
    );
    expect(requestScheduledPostSkim).toHaveBeenCalledExactlyOnceWith(
      MOCK_TENANT_ID,
      MOCK_POST_ID,
      MOCK_PUBLISHED_AT,
    );
  });
});
