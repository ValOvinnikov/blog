import { EMAIL_TYPE } from '@blog/config/constants';
import { NEWSLETTER_SKIP_REASON } from '@blog/db/constants';
import { recordEmailSend } from '@blog/db/queries/email-usage';
import { markNewsletterPostSkipped } from '@blog/db/queries/newsletter-post-sends';
import { listActiveSubscribers } from '@blog/db/queries/subscribers';
import { getTenantById } from '@blog/db/queries/tenants';
import { sendEmail } from '@blog/email';
import {
  NEWSLETTER_SEND_LOG,
  NEWSLETTER_SEND_PACE,
} from '@worker/constants/newsletter-send';
import {
  MOCK_NEWSLETTER_POST,
  MOCK_POST_ID,
  MOCK_SUBSCRIBER_EMAILS,
  MOCK_SUBSCRIBER_IDS,
} from '@worker/testing/newsletter-send/fixtures';
import { MOCK_RESEND_DOWN } from '@worker/testing/outage/fixtures';
import { MOCK_TENANT_ID, mockTenant } from '@worker/testing/tenant/fixtures';
import { logger } from '@worker/utils/logger/logger';
import { buildPostSend } from '@worker/utils/newsletter-send/build-post-send';
import {
  loadNewsletterSendContext,
  type TNewsletterSendContext,
} from '@worker/utils/newsletter-send/newsletter-send-context';
import { readReputationPace } from '@worker/utils/newsletter-send/reputation-pace';

import {
  sendNewsletterPage,
  type TNewsletterPageInput,
} from './send-newsletter-page';

vi.mock('node:timers/promises');
vi.mock('@blog/db/queries/email-usage');
vi.mock('@blog/db/queries/newsletter-post-sends');
vi.mock('@blog/db/queries/subscribers');
vi.mock('@blog/db/queries/tenants');
vi.mock('@blog/email/transport/send-email');
vi.mock('@worker/utils/newsletter-send/build-post-send');
vi.mock('@worker/utils/newsletter-send/newsletter-send-context');
vi.mock('@worker/utils/newsletter-send/reputation-pace');

const MOCK_CONTEXT = {} as TNewsletterSendContext;
const MOCK_SUBSCRIBERS = MOCK_SUBSCRIBER_IDS.map((id, index) => ({
  id,
  email: MOCK_SUBSCRIBER_EMAILS[index],
}));
const [FIRST, SECOND] = MOCK_SUBSCRIBERS;
const MOCK_INPUT: TNewsletterPageInput = {
  tenantId: MOCK_TENANT_ID,
  postId: MOCK_POST_ID,
  post: MOCK_NEWSLETTER_POST,
  afterId: undefined,
  pageSize: MOCK_SUBSCRIBERS.length,
};

describe(sendNewsletterPage, () => {
  beforeEach(() => {
    vi.mocked(getTenantById).mockResolvedValue(mockTenant());
    vi.mocked(readReputationPace).mockResolvedValue(
      NEWSLETTER_SEND_PACE.NORMAL,
    );
    vi.mocked(loadNewsletterSendContext).mockResolvedValue(MOCK_CONTEXT);
    vi.mocked(listActiveSubscribers).mockResolvedValue(MOCK_SUBSCRIBERS);
    vi.mocked(buildPostSend).mockImplementation(
      (_context, _post, { email }) => ({ to: email }) as never,
    );
  });

  it('emails and counts each subscriber on the page once', async () => {
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
    expect(recordEmailSend).toHaveBeenCalledTimes(MOCK_SUBSCRIBERS.length);
    expect(recordEmailSend).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      EMAIL_TYPE.NEWSLETTER_ISSUE,
    );
    expect(result).toEqual({
      pace: NEWSLETTER_SEND_PACE.NORMAL,
      lastId: MOCK_SUBSCRIBERS.at(-1)?.id,
      isLastPage: false,
    });
  });

  it('reads the page after the last subscriber already sent', async () => {
    await sendNewsletterPage({ ...MOCK_INPUT, afterId: FIRST?.id });

    expect(listActiveSubscribers).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_SUBSCRIBERS.length,
      FIRST?.id,
    );
  });

  it('reports the last page when fewer subscribers remain than a page holds', async () => {
    vi.mocked(listActiveSubscribers).mockResolvedValue([]);

    await expect(
      sendNewsletterPage({ ...MOCK_INPUT, afterId: FIRST?.id }),
    ).resolves.toEqual({
      pace: NEWSLETTER_SEND_PACE.NORMAL,
      lastId: FIRST?.id,
      isLastPage: true,
    });
  });

  it('skips and logs a subscriber whose address cannot be read, and sends the rest', async () => {
    vi.mocked(listActiveSubscribers).mockResolvedValue([
      { id: FIRST!.id, email: undefined },
      SECOND!,
    ]);

    await sendNewsletterPage(MOCK_INPUT);

    expect(logger.error).toHaveBeenCalledExactlyOnceWith(
      NEWSLETTER_SEND_LOG.SUBSCRIBER_UNREADABLE,
      { tenantId: MOCK_TENANT_ID, subscriberId: FIRST?.id },
    );
    expect(sendEmail).toHaveBeenCalledExactlyOnceWith({ to: SECOND?.email });
  });

  it('logs a failed send, does not count it, and carries on', async () => {
    vi.mocked(sendEmail).mockRejectedValueOnce(new Error(MOCK_RESEND_DOWN));

    await sendNewsletterPage(MOCK_INPUT);

    expect(logger.error).toHaveBeenCalledWith(NEWSLETTER_SEND_LOG.SEND_FAILED, {
      tenantId: MOCK_TENANT_ID,
      postId: MOCK_POST_ID,
      subscriberId: FIRST?.id,
      error: MOCK_RESEND_DOWN,
    });
    expect(sendEmail).toHaveBeenCalledTimes(MOCK_SUBSCRIBERS.length);
    expect(recordEmailSend).toHaveBeenCalledTimes(MOCK_SUBSCRIBERS.length - 1);
  });

  it('sends nothing more and records the skip once the reputation gate stops the site', async () => {
    vi.mocked(readReputationPace).mockResolvedValue(
      NEWSLETTER_SEND_PACE.STOPPED,
    );

    const result = await sendNewsletterPage(MOCK_INPUT);

    expect(sendEmail).not.toHaveBeenCalled();
    expect(markNewsletterPostSkipped).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_POST_ID,
      NEWSLETTER_SKIP_REASON.REPUTATION_STOP,
    );
    expect(result.pace).toBe(NEWSLETTER_SEND_PACE.STOPPED);
  });

  it('does not alert the operator about a warning mid-run', async () => {
    await sendNewsletterPage(MOCK_INPUT);

    expect(readReputationPace).toHaveBeenCalledWith(expect.anything(), {
      isWarningAlerted: false,
    });
  });
});
