import {
  MOCK_EMAILS_LEFT,
  MOCK_NEWSLETTER_LIMITS,
} from '@platform/testing/newsletter-post-send/fixtures';
import { mockTenant, MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import {
  ERROR_CODE,
  NEWSLETTER_SEND_NOW_REFUSAL,
  NEWSLETTER_SKIP_REASON,
} from '@shinefold/config';
import { queries } from '@shinefold/db';
import {
  EMAIL_REPUTATION_LEVEL,
  EMAIL_REPUTATION_MIN_RESOLVED_COUNT,
  EMAIL_REPUTATION_THRESHOLDS,
  NEWSLETTER_POST_SEND_OUTCOME,
} from '@shinefold/db/constants';
import {
  MOCK_POST_ID,
  mockNewsletterPostSend,
} from '@shinefold/db/testing/newsletter-post-sends/fixtures';
import { errorResult, okResult } from '@shinefold/utils';

import { readNewsletterPostSend } from './read-newsletter-post-send';

vi.mock('@shinefold/db', () => ({
  queries: {
    newsletterPostSends: {
      getNewsletterPostSend: vi.fn(),
      getNewsletterSendingOffCause: vi.fn(),
    },
    subscribers: { countActiveSubscribers: vi.fn() },
    emailUsage: { getNewsletterLimits: vi.fn(), getEmailReputation: vi.fn() },
    emailConfig: { getNewsletterPausedAt: vi.fn() },
  },
}));

const MOCK_CONFIRMED_COUNT = 42;
const MOCK_PAUSED_AT = new Date('2026-11-19T09:00:00.000Z');
const STOP_BOUNCE_RATE =
  EMAIL_REPUTATION_THRESHOLDS.bounceRate[EMAIL_REPUTATION_LEVEL.STOP];

const { newsletterPostSends, subscribers, emailUsage, emailConfig } = queries;

const read = (isPublished: boolean) =>
  readNewsletterPostSend(mockTenant(), { postId: MOCK_POST_ID, isPublished });

describe(readNewsletterPostSend, () => {
  beforeEach(() => {
    vi.mocked(newsletterPostSends.getNewsletterPostSend).mockResolvedValue(
      undefined,
    );
    vi.mocked(
      newsletterPostSends.getNewsletterSendingOffCause,
    ).mockResolvedValue(okResult(undefined));
    vi.mocked(subscribers.countActiveSubscribers).mockResolvedValue(
      MOCK_CONFIRMED_COUNT,
    );
    vi.mocked(emailUsage.getNewsletterLimits).mockResolvedValue(
      MOCK_NEWSLETTER_LIMITS,
    );
    vi.mocked(emailUsage.getEmailReputation).mockResolvedValue({
      resolvedCount: 0,
      bounceRate: 0,
      complaintRate: 0,
    });
    vi.mocked(emailConfig.getNewsletterPausedAt).mockResolvedValue(undefined);
  });

  it('reads only the claim, the off cause and the count for a post that is sending', async () => {
    const claim = mockNewsletterPostSend();
    vi.mocked(newsletterPostSends.getNewsletterPostSend).mockResolvedValue(
      claim,
    );

    const result = await read(true);

    expect(result).toEqual({
      claim,
      sendingOffCause: undefined,
      confirmedCount: MOCK_CONFIRMED_COUNT,
      bandCeiling: undefined,
      sendNow: { isOffered: false },
    });
    expect(newsletterPostSends.getNewsletterPostSend).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_POST_ID,
    );
    expect(emailUsage.getNewsletterLimits).not.toHaveBeenCalled();
  });

  it('never offers the send for a post that is not published', async () => {
    const result = await read(false);

    expect(result.sendNow).toEqual({ isOffered: false });
  });

  it('offers a published post with no claim the send, counting from the limits', async () => {
    const result = await read(true);

    expect(result).toEqual({
      claim: undefined,
      sendingOffCause: undefined,
      confirmedCount: MOCK_NEWSLETTER_LIMITS.activeCount,
      bandCeiling: MOCK_NEWSLETTER_LIMITS.bandCeiling,
      sendNow: { isOffered: true, emailsLeft: MOCK_EMAILS_LEFT },
    });
  });

  it('names the cause that stops the site sending', async () => {
    vi.mocked(
      newsletterPostSends.getNewsletterSendingOffCause,
    ).mockResolvedValue(okResult(NEWSLETTER_SKIP_REASON.NEWSLETTER_OFF));

    const result = await read(true);

    expect(result.sendingOffCause).toBe(NEWSLETTER_SKIP_REASON.NEWSLETTER_OFF);
    expect(result.sendNow).toEqual({
      isOffered: true,
      disabledBy: NEWSLETTER_SEND_NOW_REFUSAL.NEWSLETTER_OFF,
    });
  });

  it('offers no post the send while an operator pause holds', async () => {
    vi.mocked(emailConfig.getNewsletterPausedAt).mockResolvedValue(
      MOCK_PAUSED_AT,
    );

    const result = await read(true);

    expect(result.sendNow).toEqual({ isOffered: false });
  });

  it('offers no post the send while a reputation stop holds', async () => {
    vi.mocked(emailUsage.getEmailReputation).mockResolvedValue({
      resolvedCount: EMAIL_REPUTATION_MIN_RESOLVED_COUNT,
      bounceRate: STOP_BOUNCE_RATE,
      complaintRate: 0,
    });

    const result = await read(true);

    expect(result.sendNow).toEqual({ isOffered: false });
  });

  it('gives an unpublished band skip the band ceiling for its status', async () => {
    vi.mocked(newsletterPostSends.getNewsletterPostSend).mockResolvedValue(
      mockNewsletterPostSend({
        outcome: NEWSLETTER_POST_SEND_OUTCOME.SKIPPED,
        skipReason: NEWSLETTER_SKIP_REASON.OVER_SUBSCRIBER_BAND,
      }),
    );

    const result = await read(false);

    expect(result.bandCeiling).toBe(MOCK_NEWSLETTER_LIMITS.bandCeiling);
    expect(result.sendNow).toEqual({ isOffered: false });
  });

  it('fails when the off cause cannot be read', async () => {
    vi.mocked(
      newsletterPostSends.getNewsletterSendingOffCause,
    ).mockResolvedValue(errorResult(ERROR_CODE.DB_NOT_FOUND));

    await expect(read(true)).rejects.toThrow(ERROR_CODE.DB_NOT_FOUND);
  });
});
