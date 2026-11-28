import { faker } from '@faker-js/faker';
import {
  NEWSLETTER_SEND_STATUS,
  NEWSLETTER_SKIP_REASON,
  routes,
  type TNewsletterPostSendState,
  type TNewsletterSendingOffCause,
  type TNewsletterSkipReason,
} from '@shinefold/config';
import {
  MOCK_BAND_CEILING,
  MOCK_RECIPIENTS,
  MOCK_SEND_DATE,
  mockNewsletterPostSendStatus,
} from '@shinefold/studio/testing/newsletter-post-send-status';

import { formatSendCount, formatSendDay } from './send-status-format';
import {
  SEND_FAILED_BEFORE_ANY,
  SEND_PENDING,
  toSendStatusView,
} from './send-status-view';
import { NOT_EMAILED } from './skipped-send-status-view';

faker.seed(7711);

const MOCK_SENT = faker.number.int({ min: 1, max: MOCK_RECIPIENTS - 1 });

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

  it('names the recipients and the date of a sent post', () => {
    const view = viewOf({
      status: NEWSLETTER_SEND_STATUS.SENT,
      recipients: MOCK_RECIPIENTS,
      settledAt: MOCK_SEND_DATE,
    });

    expect([
      view?.detail.includes(formatSendCount(MOCK_RECIPIENTS)),
      view?.detail.includes(formatSendDay(MOCK_SEND_DATE)),
    ]).toStrictEqual([true, true]);
  });

  it('names the date a scheduled post is emailed on', () => {
    const view = viewOf({
      status: NEWSLETTER_SEND_STATUS.SCHEDULED,
      scheduledFor: MOCK_SEND_DATE,
    });

    expect(view?.detail).toContain(formatSendDay(MOCK_SEND_DATE));
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

  it('shows a claim the run has not counted yet as pending, not sending', () => {
    const view = viewOf({ status: NEWSLETTER_SEND_STATUS.SENDING });

    expect(view?.detail).toBe(SEND_PENDING);
  });

  it('names how far a part-way failure got, with no Not emailed lead or retry', () => {
    const view = viewOf({
      status: NEWSLETTER_SEND_STATUS.FAILED,
      sent: MOCK_SENT,
      recipients: MOCK_RECIPIENTS,
    });

    expect(view?.lead).toBeUndefined();
    expect(view?.detail).toContain(
      `${formatSendCount(MOCK_SENT)} of ${formatSendCount(MOCK_RECIPIENTS)}`,
    );
    expect(view?.detail.startsWith(NOT_EMAILED)).toBe(false);
    expect(view?.link).toBeUndefined();
  });

  it('says a run that failed before counting emailed nobody, with no retry', () => {
    const view = viewOf({ status: NEWSLETTER_SEND_STATUS.FAILED, sent: 0 });

    expect(view).toStrictEqual({
      tone: 'critical',
      lead: NOT_EMAILED,
      detail: SEND_FAILED_BEFORE_ANY,
    });
  });

  it('names the band and links to Subscribers for a band skip', () => {
    const view = viewOf({
      status: NEWSLETTER_SEND_STATUS.SKIPPED,
      skipReason: NEWSLETTER_SKIP_REASON.OVER_SUBSCRIBER_BAND,
      bandCeiling: MOCK_BAND_CEILING,
    });

    expect(view?.link?.href).toBe(routes.dashboardSubscribers());
    expect(view?.detail).toContain(formatSendCount(MOCK_BAND_CEILING));
  });

  it('links a month skip to Subscribers', () => {
    const view = viewOf(skipped(NEWSLETTER_SKIP_REASON.OVER_MONTHLY_ALLOWANCE));

    expect(view?.link?.href).toBe(routes.dashboardSubscribers());
  });

  it.each([
    NEWSLETTER_SKIP_REASON.SITE_PAUSED,
    NEWSLETTER_SKIP_REASON.REPUTATION_STOP,
    NEWSLETTER_SKIP_REASON.SITE_INACTIVE,
  ] as const)('shows a %s skip with no link', (skipReason) => {
    const view = viewOf(skipped(skipReason));

    expect(view?.link).toBeUndefined();
  });

  it('names a different reason for each kind of pause', () => {
    const details = [
      NEWSLETTER_SKIP_REASON.SITE_PAUSED,
      NEWSLETTER_SKIP_REASON.REPUTATION_STOP,
      NEWSLETTER_SKIP_REASON.SITE_INACTIVE,
    ].map((skipReason) => viewOf(skipped(skipReason))?.detail);

    expect(new Set(details).size).toBe(details.length);
  });

  it.each([
    [NEWSLETTER_SKIP_REASON.NEWSLETTER_OFF, routes.dashboardFeatures()],
    [NEWSLETTER_SKIP_REASON.SENDING_OFF, routes.dashboardSubscribers()],
  ] as const)(
    'links a %s post to the fix while that cause still holds',
    (skipReason, href) => {
      const view = viewOf(skipped(skipReason), skipReason);

      expect(view?.link?.href).toBe(href);
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
