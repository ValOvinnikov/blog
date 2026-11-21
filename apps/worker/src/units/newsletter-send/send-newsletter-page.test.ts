import {
  NEWSLETTER_SKIP_REASON,
  type TNewsletterSendingOffCause,
} from '@shinefold/config/constants';
import { getNewsletterPausedAt } from '@shinefold/db/queries/email-config';
import {
  setNewsletterPostSendProgress,
  getNewsletterSendingOffCause,
  markNewsletterPostSkipped,
} from '@shinefold/db/queries/newsletter-post-sends';
import { listActiveSubscribers } from '@shinefold/db/queries/subscribers';
import { getTenantById } from '@shinefold/db/queries/tenants';
import { SendEmailError, sendEmail } from '@shinefold/email';
import { okResult } from '@shinefold/utils';
import {
  NEWSLETTER_SEND_LOG,
  NEWSLETTER_SEND_PACE,
  NEWSLETTER_SEND_PAGE_SIZE,
} from '@worker/constants/newsletter-send';
import {
  MOCK_CLAIMED_AT,
  MOCK_NEWSLETTER_POST,
  MOCK_SUBSCRIBER_EMAILS,
  MOCK_SUBSCRIBER_IDS,
} from '@worker/testing/newsletter-send/fixtures';
import { MOCK_RESEND_DOWN } from '@worker/testing/outage/fixtures';
import { MOCK_POST_ID } from '@worker/testing/post/fixtures';
import { MOCK_TENANT_ID, mockTenant } from '@worker/testing/tenant/fixtures';
import { logger } from '@worker/utils/logger/logger';
import { buildPostSend } from '@worker/utils/newsletter-send/build-post-send';
import {
  loadNewsletterSendContext,
  type TNewsletterSendContext,
} from '@worker/utils/newsletter-send/newsletter-send-context';
import { readReputationPace } from '@worker/utils/newsletter-send/reputation-pace';
import { FatalError } from 'workflow';

import {
  sendNewsletterPage,
  type TNewsletterPageInput,
} from './send-newsletter-page';

vi.mock('node:timers/promises');
vi.mock('@shinefold/db/queries/email-config');
vi.mock('@shinefold/db/queries/newsletter-post-sends');
vi.mock('@shinefold/db/queries/subscribers');
vi.mock('@shinefold/db/queries/tenants');
vi.mock('@shinefold/email/transport/send-email');
vi.mock('@worker/utils/newsletter-send/build-post-send');
vi.mock('@worker/utils/newsletter-send/newsletter-send-context');
vi.mock('@worker/utils/newsletter-send/reputation-pace');

const MOCK_CONTEXT = {} as TNewsletterSendContext;
const MOCK_SUBSCRIBERS = MOCK_SUBSCRIBER_IDS.map((id, index) => ({
  id,
  email: MOCK_SUBSCRIBER_EMAILS[index],
}));
const [FIRST, SECOND] = MOCK_SUBSCRIBERS;
const MOCK_REACHED_BEFORE = 100;
const MOCK_INPUT: TNewsletterPageInput = {
  tenantId: MOCK_TENANT_ID,
  postId: MOCK_POST_ID,
  claimedAt: MOCK_CLAIMED_AT,
  post: MOCK_NEWSLETTER_POST,
  afterId: undefined,
  reachedBefore: MOCK_REACHED_BEFORE,
};
const MOCK_RATE_LIMITED = new SendEmailError(
  MOCK_RESEND_DOWN,
  429,
  'rate_limit_exceeded',
);
const MOCK_REJECTED_ADDRESS = new SendEmailError(
  MOCK_RESEND_DOWN,
  422,
  'validation_error',
);

describe(sendNewsletterPage, () => {
  beforeEach(() => {
    vi.mocked(getTenantById).mockResolvedValue(mockTenant());
    vi.mocked(getNewsletterPausedAt).mockResolvedValue(undefined);
    vi.mocked(getNewsletterSendingOffCause).mockResolvedValue(
      okResult(undefined),
    );
    vi.mocked(readReputationPace).mockResolvedValue(
      NEWSLETTER_SEND_PACE.NORMAL,
    );
    vi.mocked(loadNewsletterSendContext).mockResolvedValue(MOCK_CONTEXT);
    vi.mocked(listActiveSubscribers).mockResolvedValue(MOCK_SUBSCRIBERS);
    vi.mocked(buildPostSend).mockImplementation(
      (_context, _post, { email }) => ({ to: email }) as never,
    );
  });

  it('emails each subscriber on the page once and reports how many it sent', async () => {
    const result = await sendNewsletterPage(MOCK_INPUT);

    expect(vi.mocked(sendEmail).mock.calls.map(([input]) => input.to)).toEqual(
      MOCK_SUBSCRIBER_EMAILS,
    );
    expect(buildPostSend).toHaveBeenCalledWith(
      MOCK_CONTEXT,
      MOCK_NEWSLETTER_POST,
      {
        tenantId: MOCK_TENANT_ID,
        postId: MOCK_POST_ID,
        subscriberId: FIRST?.id,
        email: FIRST?.email,
      },
    );
    expect(result).toEqual({
      pace: NEWSLETTER_SEND_PACE.NORMAL,
      lastId: MOCK_SUBSCRIBERS.at(-1)?.id,
      isLastPage: true,
      reachedCount: MOCK_REACHED_BEFORE + MOCK_SUBSCRIBERS.length,
      sentCount: MOCK_SUBSCRIBERS.length,
      unreadableCount: 0,
    });
  });

  it('reads the page after the last subscriber already sent', async () => {
    await sendNewsletterPage({ ...MOCK_INPUT, afterId: FIRST?.id });

    expect(listActiveSubscribers).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      NEWSLETTER_SEND_PAGE_SIZE,
      FIRST?.id,
    );
  });

  it('reports more to come after a full page', async () => {
    vi.mocked(listActiveSubscribers).mockResolvedValue(
      Array.from({ length: NEWSLETTER_SEND_PAGE_SIZE }, (_, index) => ({
        id: String(index),
        email: FIRST?.email,
      })),
    );

    const { isLastPage } = await sendNewsletterPage(MOCK_INPUT);

    expect(isLastPage).toBe(false);
  });

  it('counts a subscriber whose address cannot be read, and sends the rest', async () => {
    vi.mocked(listActiveSubscribers).mockResolvedValue([
      { id: FIRST?.id ?? '', email: undefined },
      SECOND ?? { id: '', email: undefined },
    ]);

    const result = await sendNewsletterPage(MOCK_INPUT);

    expect(sendEmail).toHaveBeenCalledExactlyOnceWith({ to: SECOND?.email });
    expect(result).toMatchObject({ sentCount: 1, unreadableCount: 1 });
  });

  it('fails the run, logging once, when no address on a page can be read', async () => {
    vi.mocked(listActiveSubscribers).mockResolvedValue(
      MOCK_SUBSCRIBER_IDS.map((id) => ({ id, email: undefined })),
    );

    await expect(sendNewsletterPage(MOCK_INPUT)).rejects.toThrow(FatalError);
    expect(sendEmail).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledExactlyOnceWith(
      NEWSLETTER_SEND_LOG.PAGE_UNREADABLE,
      {
        tenantId: MOCK_TENANT_ID,
        postId: MOCK_POST_ID,
        count: MOCK_SUBSCRIBER_IDS.length,
      },
    );
  });

  it('throws on a send Resend may accept later, so the page is retried', async () => {
    vi.mocked(sendEmail).mockRejectedValueOnce(MOCK_RATE_LIMITED);

    await expect(sendNewsletterPage(MOCK_INPUT)).rejects.toBe(
      MOCK_RATE_LIMITED,
    );
  });

  it('logs and skips a send that can never succeed, and carries on', async () => {
    vi.mocked(sendEmail).mockRejectedValueOnce(MOCK_REJECTED_ADDRESS);

    const { sentCount } = await sendNewsletterPage(MOCK_INPUT);

    expect(logger.error).toHaveBeenCalledWith(
      NEWSLETTER_SEND_LOG.SEND_FAILED,
      expect.objectContaining({ subscriberId: FIRST?.id }),
    );
    expect(sendEmail).toHaveBeenCalledTimes(MOCK_SUBSCRIBERS.length);
    expect(sentCount).toBe(MOCK_SUBSCRIBERS.length - 1);
  });

  function arrangeOffCause(cause: TNewsletterSendingOffCause) {
    return () =>
      vi
        .mocked(getNewsletterSendingOffCause)
        .mockResolvedValue(okResult(cause));
  }

  it.each([
    [
      'the reputation gate stops the site',
      () =>
        vi
          .mocked(readReputationPace)
          .mockResolvedValue(NEWSLETTER_SEND_PACE.STOPPED),
      NEWSLETTER_SKIP_REASON.REPUTATION_STOP,
    ],
    [
      'an operator pauses the site',
      () => vi.mocked(getNewsletterPausedAt).mockResolvedValue(new Date()),
      NEWSLETTER_SKIP_REASON.SITE_PAUSED,
    ],
    [
      'the plan loses Newsletter',
      arrangeOffCause(NEWSLETTER_SKIP_REASON.NOT_IN_PLAN),
      NEWSLETTER_SKIP_REASON.NOT_IN_PLAN,
    ],
    [
      'the site stops being active',
      arrangeOffCause(NEWSLETTER_SKIP_REASON.SITE_INACTIVE),
      NEWSLETTER_SKIP_REASON.SITE_INACTIVE,
    ],
    [
      'Newsletter is turned off',
      arrangeOffCause(NEWSLETTER_SKIP_REASON.NEWSLETTER_OFF),
      NEWSLETTER_SKIP_REASON.SITE_PAUSED,
    ],
    [
      'the sending setting is turned off',
      arrangeOffCause(NEWSLETTER_SKIP_REASON.SENDING_OFF),
      NEWSLETTER_SKIP_REASON.SITE_PAUSED,
    ],
  ])(
    'sends nothing more once %s mid-run, recording %s',
    async (_, arrange, stored) => {
      arrange();

      const result = await sendNewsletterPage(MOCK_INPUT);

      expect(sendEmail).not.toHaveBeenCalled();
      expect(markNewsletterPostSkipped).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        MOCK_POST_ID,
        stored,
      );
      expect(result.pace).toBe(NEWSLETTER_SEND_PACE.STOPPED);
    },
  );

  describe('a page that sends', () => {
    beforeEach(async () => {
      await sendNewsletterPage(MOCK_INPUT);
    });

    it('records the running total of subscribers reached, page included', async () => {
      expect(setNewsletterPostSendProgress).toHaveBeenCalledExactlyOnceWith(
        MOCK_TENANT_ID,
        MOCK_POST_ID,
        new Date(MOCK_CLAIMED_AT),
        MOCK_REACHED_BEFORE + MOCK_SUBSCRIBERS.length,
      );
    });

    it('does not alert the operator mid-run', async () => {
      expect(readReputationPace).toHaveBeenCalledWith(expect.anything(), {
        isOperatorAlerted: false,
      });
    });
  });
});
