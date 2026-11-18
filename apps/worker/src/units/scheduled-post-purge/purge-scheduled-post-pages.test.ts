import { WEB_SCHEDULED_POST_PURGE_PATH } from '@worker/constants/scheduled-post-purge';
import { MOCK_POST_ID } from '@worker/testing/post/fixtures';
import { MOCK_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { postScheduledPostToWeb } from '@worker/utils/scheduled-post/post-to-web';

import { purgeScheduledPostPages } from './purge-scheduled-post-pages';

vi.mock('@worker/utils/scheduled-post/post-to-web');

describe(purgeScheduledPostPages, () => {
  it("posts the post to web's purge route", async () => {
    await purgeScheduledPostPages(MOCK_TENANT_ID, MOCK_POST_ID);

    expect(postScheduledPostToWeb).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        path: WEB_SCHEDULED_POST_PURGE_PATH,
        body: { tenantId: MOCK_TENANT_ID, postId: MOCK_POST_ID },
      }),
    );
  });
});
