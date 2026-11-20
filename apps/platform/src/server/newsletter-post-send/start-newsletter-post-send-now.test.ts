import { faker } from '@faker-js/faker';
import {
  NEWSLETTER_POST_SEND_PATH,
  STUDIO_NEWSLETTER_LOG,
} from '@platform/constants/studio-newsletter';
import { WORKER_LOG } from '@platform/constants/worker';
import { readNewsletterPostSend } from '@platform/server/newsletter-post-send/read-newsletter-post-send';
import { mockedWorkerSecretsEnv } from '@platform/testing/env/mocked-env';
import { MOCK_NETWORK_ERROR } from '@platform/testing/http/network-error';
import { MOCK_TENANT_ID, mockTenant } from '@platform/testing/tenants/fixtures';
import { MOCK_WORKER_URL } from '@platform/testing/worker/fixtures';
import { readSentSignedRequest } from '@platform/testing/worker/sent-signed-request';
import {
  stubWorkerFetch,
  type TWorkerFetchMock,
} from '@platform/testing/worker/stub-worker-fetch';
import { logger } from '@platform/utils/logger/logger';
import {
  ACTION_OUTCOME,
  HTTP_STATUS,
  NEWSLETTER_SEND_NOW_REFUSAL,
  NEWSLETTER_SKIP_REASON,
} from '@shinefold/config';
import { queries } from '@shinefold/db';
import { NEWSLETTER_POST_SEND_OUTCOME } from '@shinefold/db/constants';
import { MOCK_NOW } from '@shinefold/db/testing/frozen-clock';
import {
  MOCK_POST_ID,
  MOCK_SKIP_DETAILS,
  mockNewsletterPostSend,
} from '@shinefold/db/testing/newsletter-post-sends/fixtures';

import { startNewsletterPostSendNow } from './start-newsletter-post-send-now';

vi.mock('@platform/utils/env/env');
vi.mock('@platform/utils/worker-secrets-env/worker-secrets-env');
vi.mock('@platform/server/newsletter-post-send/read-newsletter-post-send');

vi.mock('@shinefold/db', () => ({
  queries: {
    newsletterPostSends: {
      startNewsletterPostSendByHand: vi.fn(),
      markNewsletterPostSkipped: vi.fn(),
      releaseNewsletterPostSend: vi.fn(),
    },
  },
}));

faker.seed(7712);

const MOCK_NEWSLETTER_SECRET = faker.string.alphanumeric(32);
const MOCK_REQUEST = { postId: MOCK_POST_ID, isPublished: true };
const { emailsNeeded, allowanceLeft } = MOCK_SKIP_DETAILS;

const startByHand = vi.mocked(
  queries.newsletterPostSends.startNewsletterPostSendByHand,
);
const markSkipped = vi.mocked(
  queries.newsletterPostSends.markNewsletterPostSkipped,
);
const release = vi.mocked(
  queries.newsletterPostSends.releaseNewsletterPostSend,
);

const readsAs = (
  read: Partial<Awaited<ReturnType<typeof readNewsletterPostSend>>>,
) =>
  vi.mocked(readNewsletterPostSend).mockResolvedValue({
    claim: undefined,
    sendingOffCause: undefined,
    confirmedCount: 1,
    bandCeiling: undefined,
    sendNow: { isOffered: true, emailsLeft: 1 },
    ...read,
  });

const start = () => startNewsletterPostSendNow(mockTenant(), MOCK_REQUEST);

describe(startNewsletterPostSendNow, () => {
  const fetchMock: TWorkerFetchMock = vi.fn();

  beforeEach(() => {
    stubWorkerFetch(fetchMock);
    mockedWorkerSecretsEnv.WORKER_NEWSLETTER_ENQUEUE_SECRET =
      MOCK_NEWSLETTER_SECRET;
    readsAs({});
    startByHand.mockResolvedValue({
      claimedAt: MOCK_NOW,
      clearedSkipReason: undefined,
      clearedEmailsNeeded: undefined,
      clearedAllowanceLeft: undefined,
    });
  });

  it("starts the worker's post send, signed with the newsletter secret", async () => {
    const result = await start();

    const { url, body, isSignedWith } = readSentSignedRequest(fetchMock);
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(startByHand).toHaveBeenCalledWith(MOCK_TENANT_ID, MOCK_POST_ID);
    expect(url.toString()).toBe(
      `${MOCK_WORKER_URL}${NEWSLETTER_POST_SEND_PATH}`,
    );
    expect(body).toEqual({
      tenantId: MOCK_TENANT_ID,
      postId: MOCK_POST_ID,
      claimedAt: MOCK_NOW.toISOString(),
    });
    expect(
      isSignedWith(MOCK_NEWSLETTER_SECRET, NEWSLETTER_POST_SEND_PATH),
    ).toBe(true);
  });

  it('refuses a post its read refuses, and starts nothing', async () => {
    readsAs({ sendNow: { isOffered: false } });

    const result = await start();

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: NEWSLETTER_SEND_NOW_REFUSAL.NOT_ELIGIBLE,
    });
    expect(startByHand).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuses a second press that loses the race for the claim', async () => {
    startByHand.mockResolvedValue(undefined);

    const result = await start();

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: NEWSLETTER_SEND_NOW_REFUSAL.ALREADY_SENT,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  describe('when the worker does not start the run', () => {
    it('releases a claim it created, logs the refusal and lets the editor press again', async () => {
      fetchMock.mockResolvedValue(
        new Response(null, { status: HTTP_STATUS.UNAUTHORIZED }),
      );

      const result = await start();

      expect(result).toEqual({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: NEWSLETTER_SEND_NOW_REFUSAL.SEND_FAILED,
      });
      expect(release).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        MOCK_POST_ID,
        MOCK_NOW,
      );
      expect(logger.error).toHaveBeenCalledWith(
        STUDIO_NEWSLETTER_LOG.SEND_NOW_ENQUEUE_REFUSED,
        {
          tenantId: MOCK_TENANT_ID,
          postId: MOCK_POST_ID,
          status: HTTP_STATUS.UNAUTHORIZED,
        },
      );
    });

    it('marks a cleared skip skipped again with its earlier reason', async () => {
      fetchMock.mockRejectedValue(MOCK_NETWORK_ERROR);
      startByHand.mockResolvedValue({
        claimedAt: MOCK_NOW,
        clearedSkipReason: NEWSLETTER_SKIP_REASON.OVER_MONTHLY_ALLOWANCE,
        clearedEmailsNeeded: emailsNeeded,
        clearedAllowanceLeft: allowanceLeft,
      });
      readsAs({
        claim: mockNewsletterPostSend({
          outcome: NEWSLETTER_POST_SEND_OUTCOME.SKIPPED,
          skipReason: NEWSLETTER_SKIP_REASON.OVER_MONTHLY_ALLOWANCE,
        }),
      });

      const result = await start();

      expect(result).toEqual({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: NEWSLETTER_SEND_NOW_REFUSAL.SEND_FAILED,
      });
      expect(markSkipped).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        MOCK_POST_ID,
        NEWSLETTER_SKIP_REASON.OVER_MONTHLY_ALLOWANCE,
        { emailsNeeded, allowanceLeft },
      );
      expect(release).not.toHaveBeenCalled();
    });

    it('refuses without contacting the worker when the newsletter secret is unset', async () => {
      mockedWorkerSecretsEnv.WORKER_NEWSLETTER_ENQUEUE_SECRET = undefined;

      const result = await start();

      expect(result).toEqual({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: NEWSLETTER_SEND_NOW_REFUSAL.SEND_FAILED,
      });
      expect(fetchMock).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(WORKER_LOG.ENQUEUE_SKIPPED, {
        tenantId: MOCK_TENANT_ID,
        postId: MOCK_POST_ID,
        hasWorkerUrl: true,
        hasSecret: false,
      });
    });
  });
});
