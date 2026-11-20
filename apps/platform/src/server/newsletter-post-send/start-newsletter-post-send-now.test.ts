import { faker } from '@faker-js/faker';
import { STUDIO_NEWSLETTER_LOG } from '@platform/constants/studio-newsletter';
import { WORKER_LOG } from '@platform/constants/worker';
import { readNewsletterPostSend } from '@platform/server/newsletter-post-send/read-newsletter-post-send';
import { mockedWorkerSecretsEnv } from '@platform/testing/env/mocked-env';
import { MOCK_NETWORK_ERROR } from '@platform/testing/http/network-error';
import { MOCK_TENANT_ID, mockTenant } from '@platform/testing/tenants/fixtures';
import { MOCK_WORKER_URL } from '@platform/testing/worker/fixtures';
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
import {
  ENQUEUE_SIGNATURE_HEADER,
  ENQUEUE_TIMESTAMP_HEADER,
  isValidEnqueueSignature,
} from '@shinefold/utils/enqueue-signature';

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
const REQUEST = { postId: MOCK_POST_ID, isPublished: true };
const NEWSLETTER_POST_SEND_PATH = '/api/newsletter/post-send';
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

const start = () => startNewsletterPostSendNow(mockTenant(), REQUEST);

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

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    const headers = init.headers as Record<string, string>;
    const rawBody = init.body as string;
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(startByHand).toHaveBeenCalledWith(MOCK_TENANT_ID, MOCK_POST_ID);
    expect(url.toString()).toBe(
      `${MOCK_WORKER_URL}${NEWSLETTER_POST_SEND_PATH}`,
    );
    expect(JSON.parse(rawBody)).toEqual({
      tenantId: MOCK_TENANT_ID,
      postId: MOCK_POST_ID,
      claimedAt: MOCK_NOW.toISOString(),
    });
    expect(
      isValidEnqueueSignature({
        secret: MOCK_NEWSLETTER_SECRET,
        timestamp: headers[ENQUEUE_TIMESTAMP_HEADER] ?? null,
        signature: headers[ENQUEUE_SIGNATURE_HEADER] ?? null,
        path: NEWSLETTER_POST_SEND_PATH,
        rawBody,
      }),
    ).toBe(true);
  });

  it.each([
    {
      name: 'a post that started sending',
      read: { claim: mockNewsletterPostSend(), sendNow: { isOffered: false } },
      reason: NEWSLETTER_SEND_NOW_REFUSAL.ALREADY_SENT,
    },
    {
      name: 'a post never offered the send',
      read: { sendNow: { isOffered: false } },
      reason: NEWSLETTER_SEND_NOW_REFUSAL.NOT_ELIGIBLE,
    },
    {
      name: 'a post whose cause is still there',
      read: {
        sendNow: {
          isOffered: true,
          disabledBy: NEWSLETTER_SEND_NOW_REFUSAL.SENDING_OFF,
        },
      },
      reason: NEWSLETTER_SEND_NOW_REFUSAL.SENDING_OFF,
    },
  ] as const)('refuses $name and starts nothing', async ({ read, reason }) => {
    readsAs(read);

    const result = await start();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.REFUSED, reason });
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
