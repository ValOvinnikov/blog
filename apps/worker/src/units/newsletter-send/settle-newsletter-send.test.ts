import {
  getNewsletterPostSend,
  markNewsletterPostFailed,
} from '@shinefold/db/queries/newsletter-post-sends';
import {
  MOCK_POST_SEND_START,
  mockNewsletterPostSend,
} from '@shinefold/db/testing/newsletter-post-sends/fixtures';
import { NEWSLETTER_SEND_LOG } from '@worker/constants/newsletter-send';
import { MOCK_SUBSCRIBER_IDS } from '@worker/testing/newsletter-send/fixtures';
import { MOCK_WORKFLOW_CRASH } from '@worker/testing/outage/fixtures';
import { MOCK_POST_ID } from '@worker/testing/post/fixtures';
import { MOCK_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { logger } from '@worker/utils/logger/logger';

import { failNewsletterSend } from './settle-newsletter-send';

vi.mock('@shinefold/db/queries/email-usage');
vi.mock('@shinefold/db/queries/newsletter-post-sends');

const { recipientCount } = MOCK_POST_SEND_START;
const MOCK_REACHED_COUNT = MOCK_SUBSCRIBER_IDS.length;

function failSend() {
  return failNewsletterSend(MOCK_TENANT_ID, MOCK_POST_ID, MOCK_WORKFLOW_CRASH);
}

describe(failNewsletterSend, () => {
  beforeEach(() => {
    vi.mocked(getNewsletterPostSend).mockResolvedValue(
      mockNewsletterPostSend({
        recipientCount,
        sentCount: MOCK_REACHED_COUNT,
      }),
    );
  });

  describe('with a send under way', () => {
    beforeEach(async () => {
      await failSend();
    });

    it('settles the claim as failed', async () => {
      expect(markNewsletterPostFailed).toHaveBeenCalledExactlyOnceWith(
        MOCK_TENANT_ID,
        MOCK_POST_ID,
      );
    });

    it('logs the failure once with how far the send got', async () => {
      expect(logger.error).toHaveBeenCalledExactlyOnceWith(
        NEWSLETTER_SEND_LOG.RUN_FAILED,
        {
          tenantId: MOCK_TENANT_ID,
          postId: MOCK_POST_ID,
          reachedCount: MOCK_REACHED_COUNT,
          recipientCount,
          error: MOCK_WORKFLOW_CRASH,
        },
      );
    });
  });

  it('logs a failure before the gate with nobody reached and no recipient count', async () => {
    vi.mocked(getNewsletterPostSend).mockResolvedValue(
      mockNewsletterPostSend({ recipientCount: undefined }),
    );

    await failSend();

    expect(logger.error).toHaveBeenCalledExactlyOnceWith(
      NEWSLETTER_SEND_LOG.RUN_FAILED,
      {
        tenantId: MOCK_TENANT_ID,
        postId: MOCK_POST_ID,
        reachedCount: 0,
        recipientCount: undefined,
        error: MOCK_WORKFLOW_CRASH,
      },
    );
  });
});
