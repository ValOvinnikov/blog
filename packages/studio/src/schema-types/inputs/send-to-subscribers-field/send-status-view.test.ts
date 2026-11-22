import {
  NEWSLETTER_SEND_STATUS,
  NEWSLETTER_SKIP_REASON,
  routes,
  type TNewsletterPostSendState,
  type TNewsletterSendingOffCause,
  type TNewsletterSkipReason,
} from '@shinefold/config';
import { mockNewsletterPostSendStatus } from '@shinefold/studio/testing/newsletter-post-send-status';

import {
  formatSendCount,
  formatSendDay,
  formatSubscribers,
} from './send-status-format';
import { toSendStatusView } from './send-status-view';

const MOCK_DATE = '2026-11-22T12:00:00.000Z';
const MOCK_RECIPIENTS = 1_180;
const MOCK_SENT = 420;
const MOCK_BAND_CEILING = 1_000;

const viewOf = (
  state: TNewsletterPostSendState,
  sendingOffCause?: TNewsletterSendingOffCause,
) => toSendStatusView(mockNewsletterPostSendStatus(state, { sendingOffCause }));

const skipped = (
  skipReason: Exclude<
    TNewsletterSkipReason,
    typeof NEWSLETTER_SKIP_REASON.OVER_SUBSCRIBER_BAND
  >,
) => ({ status: NEWSLETTER_SEND_STATUS.SKIPPED, skipReason }) as const;

describe(toSendStatusView, () => {
  beforeEach(() => {
    vi.stubEnv('TZ', 'UTC');
  });

  it('keeps the switch for a post with no claim', () => {
    expect(viewOf({ status: NEWSLETTER_SEND_STATUS.NONE })).toBeUndefined();
  });

  it('shows a sent post in the positive tone with its recipients and date', () => {
    const view = viewOf({
      status: NEWSLETTER_SEND_STATUS.SENT,
      recipients: MOCK_RECIPIENTS,
      settledAt: MOCK_DATE,
    });

    expect([view?.tone, view?.detail]).toStrictEqual([
      'positive',
      ` to ${formatSubscribers(MOCK_RECIPIENTS)} on ${formatSendDay(MOCK_DATE)}.`,
    ]);
  });

  it('names the date a scheduled post is emailed on', () => {
    const view = viewOf({
      status: NEWSLETTER_SEND_STATUS.SCHEDULED,
      scheduledFor: MOCK_DATE,
    });

    expect(view?.detail).toContain(formatSendDay(MOCK_DATE));
  });

  it('counts how many subscribers a sending post has reached so far', () => {
    const view = viewOf({
      status: NEWSLETTER_SEND_STATUS.SENDING,
      sent: MOCK_SENT,
      recipients: MOCK_RECIPIENTS,
    });

    expect(view?.detail).toContain(
      `${formatSendCount(MOCK_SENT)} of ${formatSendCount(MOCK_RECIPIENTS)}`,
    );
  });

  it('shows no count before the run has counted its recipients', () => {
    const view = viewOf({ status: NEWSLETTER_SEND_STATUS.SENDING });

    expect(view?.detail).not.toContain(formatSendCount(MOCK_SENT));
  });

  it('names the band and links to Subscribers for a band skip', () => {
    const view = viewOf({
      status: NEWSLETTER_SEND_STATUS.SKIPPED,
      skipReason: NEWSLETTER_SKIP_REASON.OVER_SUBSCRIBER_BAND,
      bandCeiling: MOCK_BAND_CEILING,
    });

    expect([view?.tone, view?.link?.href]).toStrictEqual([
      'critical',
      routes.dashboardSubscribers(),
    ]);
    expect(view?.detail).toContain(formatSendCount(MOCK_BAND_CEILING));
  });

  it('links a month skip to Subscribers', () => {
    const view = viewOf(skipped(NEWSLETTER_SKIP_REASON.OVER_MONTHLY_ALLOWANCE));

    expect([view?.tone, view?.link?.href]).toStrictEqual([
      'critical',
      routes.dashboardSubscribers(),
    ]);
  });

  it.each([
    NEWSLETTER_SKIP_REASON.SITE_PAUSED,
    NEWSLETTER_SKIP_REASON.REPUTATION_STOP,
    NEWSLETTER_SKIP_REASON.SITE_INACTIVE,
  ] as const)('shows a %s skip as paused, with no link', (skipReason) => {
    const pausedView = viewOf(skipped(NEWSLETTER_SKIP_REASON.SITE_PAUSED));
    const view = viewOf(skipped(skipReason));

    expect(view).toStrictEqual(pausedView);
    expect(view?.link).toBeUndefined();
  });

  it.each([
    [NEWSLETTER_SKIP_REASON.NEWSLETTER_OFF, routes.dashboardFeatures()],
    [NEWSLETTER_SKIP_REASON.SENDING_OFF, routes.dashboardSubscribers()],
  ] as const)(
    'links a %s post to the fix while that cause still holds',
    (skipReason, href) => {
      const view = viewOf(skipped(skipReason), skipReason);

      expect([view?.tone, view?.link?.href]).toStrictEqual([
        'transparent',
        href,
      ]);
    },
  );

  it.each([
    NEWSLETTER_SKIP_REASON.NEWSLETTER_OFF,
    NEWSLETTER_SKIP_REASON.SENDING_OFF,
  ] as const)('drops the fix link once %s no longer holds', (skipReason) => {
    const view = viewOf(skipped(skipReason));

    expect(view?.link).toBeUndefined();
  });
});
