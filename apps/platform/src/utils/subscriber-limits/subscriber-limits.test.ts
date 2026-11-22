import {
  SUBSCRIBER_LIMIT_STATE,
  SUBSCRIBERS_NOTICE,
} from '@platform/constants/subscribers';
import { MOCK_NEWSLETTER_LIMITS } from '@platform/testing/newsletter-post-send/fixtures';
import {
  MOCK_SENT_THIS_MONTH,
  MOCK_SUBSCRIBER_COUNT,
  MOCK_SUBSCRIBERS_ALLOWANCE,
  MOCK_SUBSCRIBERS_BAND_CEILING,
  MOCK_SUBSCRIBERS_LIMITS,
} from '@platform/testing/subscribers/fixtures';
import type { TNewsletterLimits } from '@shinefold/db/queries/email-usage';

import { toSubscriberLimits } from './subscriber-limits';

const UNDER_LIMITS = MOCK_SUBSCRIBERS_LIMITS;
const BAND_NEAR_LIMITS = { ...UNDER_LIMITS, activeCount: 850 };
const BAND_OVER_LIMITS = { ...UNDER_LIMITS, activeCount: 1_040 };
const EMAILS_NEAR_LIMITS = { ...UNDER_LIMITS, sentThisMonth: 5_000 };
const EMAILS_OUT_LIMITS = { ...UNDER_LIMITS, sentThisMonth: 5_800 };

const limitsFor = (
  limits: TNewsletterLimits,
  overrides: { isOperatorPaused?: boolean; hasMovedUp?: boolean } = {},
) =>
  toSubscriberLimits({
    limits,
    isOperatorPaused: false,
    hasMovedUp: false,
    ...overrides,
  });

describe(toSubscriberLimits, () => {
  it('shows no notice and both cards under their limits', () => {
    const { notice, band, emails } = limitsFor(UNDER_LIMITS);

    expect(notice).toBeUndefined();
    expect(band).toEqual({
      state: SUBSCRIBER_LIMIT_STATE.UNDER,
      count: MOCK_SUBSCRIBER_COUNT,
      ceiling: MOCK_SUBSCRIBERS_BAND_CEILING,
      percent: 30,
      left: 700,
      over: 0,
    });
    expect(emails).toEqual({
      state: SUBSCRIBER_LIMIT_STATE.UNDER,
      sent: MOCK_SENT_THIS_MONTH,
      allowance: MOCK_SUBSCRIBERS_ALLOWANCE,
      percent: 15,
      left: 5_100,
      postNeeds: MOCK_SUBSCRIBER_COUNT,
      postsLeft: 17,
    });
  });

  it.each([
    [
      'an operator pause',
      UNDER_LIMITS,
      { isOperatorPaused: true },
      SUBSCRIBERS_NOTICE.OPERATOR_PAUSE,
    ],
    [
      'over the band before out of emails',
      { ...EMAILS_OUT_LIMITS, activeCount: 1_040 },
      {},
      SUBSCRIBERS_NOTICE.BAND_PAUSED,
    ],
    [
      'out of emails before a near band',
      { ...EMAILS_OUT_LIMITS, activeCount: 850 },
      {},
      SUBSCRIBERS_NOTICE.EMAILS_PAUSED,
    ],
    [
      'a near band before near emails',
      { ...EMAILS_NEAR_LIMITS, activeCount: 850 },
      {},
      SUBSCRIBERS_NOTICE.BAND_NEAR,
    ],
    ['near emails', EMAILS_NEAR_LIMITS, {}, SUBSCRIBERS_NOTICE.EMAILS_NEAR],
    [
      'a move up nothing outranks',
      UNDER_LIMITS,
      { hasMovedUp: true },
      SUBSCRIBERS_NOTICE.MOVED_UP,
    ],
  ] as const)('shows %s', (_, limits, overrides, notice) => {
    expect(limitsFor(limits, overrides).notice).toBe(notice);
  });

  it('keeps a move up behind a near notice', () => {
    const { notice } = limitsFor(BAND_NEAR_LIMITS, { hasMovedUp: true });

    expect(notice).toBe(SUBSCRIBERS_NOTICE.BAND_NEAR);
  });

  it('marks only the band card paused when the band notice shows', () => {
    const { band, emails } = limitsFor({
      ...EMAILS_OUT_LIMITS,
      activeCount: 1_040,
    });

    expect(band.state).toBe(SUBSCRIBER_LIMIT_STATE.PAUSED);
    expect(band.over).toBe(40);
    expect(emails.state).toBe(SUBSCRIBER_LIMIT_STATE.NEAR);
  });

  it('marks the emails card paused when the month notice shows', () => {
    const { emails } = limitsFor(EMAILS_OUT_LIMITS);

    expect(emails.state).toBe(SUBSCRIBER_LIMIT_STATE.PAUSED);
    expect(emails.left).toBe(200);
  });

  it('keeps both cards unpaused under an operator pause', () => {
    const { band } = limitsFor(BAND_OVER_LIMITS, { isOperatorPaused: true });

    expect(band.state).toBe(SUBSCRIBER_LIMIT_STATE.NEAR);
  });

  it('counts no posts left for an empty list', () => {
    const { emails } = limitsFor({ ...MOCK_NEWSLETTER_LIMITS, activeCount: 0 });

    expect(emails.postsLeft).toBe(0);
  });
});
