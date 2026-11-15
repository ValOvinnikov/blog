import { faker } from '@faker-js/faker';
import { REVALIDATE_LOG } from '@web/constants/revalidate';
import { enqueueWorkerRun } from '@web/server/revalidate/enqueue-worker-run/enqueue-worker-run';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';

import { enqueueNewsletterPostSend } from './enqueue-newsletter-post-send';

vi.mock('@web/server/revalidate/enqueue-worker-run/enqueue-worker-run', () => ({
  enqueueWorkerRun: vi.fn(),
}));

faker.seed(7163);

const MOCK_REQUEST = {
  tenantId: MOCK_TENANT_ID,
  postId: faker.string.uuid(),
  claimedAt: faker.date.recent().toISOString(),
};

describe(enqueueNewsletterPostSend, () => {
  it("enqueues the claim on the worker's newsletter send route", async () => {
    await enqueueNewsletterPostSend(MOCK_REQUEST);

    expect(enqueueWorkerRun).toHaveBeenCalledWith({
      path: '/api/newsletter/post-send',
      request: MOCK_REQUEST,
      log: {
        SKIPPED: REVALIDATE_LOG.NEWSLETTER_SEND_ENQUEUE_SKIPPED,
        REFUSED: REVALIDATE_LOG.NEWSLETTER_SEND_ENQUEUE_REFUSED,
        FAILED: REVALIDATE_LOG.NEWSLETTER_SEND_ENQUEUE_FAILED,
      },
    });
  });
});
