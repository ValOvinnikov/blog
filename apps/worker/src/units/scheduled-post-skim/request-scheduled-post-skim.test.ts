import { WEB_SCHEDULED_POST_SKIM_PATH } from '@worker/constants/scheduled-post-skim';
import { MOCK_POST_ID } from '@worker/testing/post/fixtures';
import { MOCK_PUBLISHED_AT } from '@worker/testing/scheduled-post/fixtures';
import { MOCK_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { postScheduledPostToWeb } from '@worker/utils/scheduled-post/post-to-web';

import { requestScheduledPostSkim } from './request-scheduled-post-skim';

vi.mock('@worker/utils/scheduled-post/post-to-web');

describe(requestScheduledPostSkim, () => {
  it("posts the post and its go-live date to web's takeaways route", async () => {
    await requestScheduledPostSkim(
      MOCK_TENANT_ID,
      MOCK_POST_ID,
      MOCK_PUBLISHED_AT,
    );

    expect(postScheduledPostToWeb).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        path: WEB_SCHEDULED_POST_SKIM_PATH,
        body: {
          tenantId: MOCK_TENANT_ID,
          postId: MOCK_POST_ID,
          publishedAt: MOCK_PUBLISHED_AT,
        },
      }),
    );
  });
});
