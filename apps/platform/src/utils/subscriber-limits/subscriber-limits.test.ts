import {
  SUBSCRIBER_LIMIT_STATE,
  SUBSCRIBERS_NOTICE,
} from '@platform/constants/subscribers';
import { MOCK_NEWSLETTER_LIMITS } from '@platform/testing/newsletter-post-send/fixtures';
import {
  MOCK_BAND_NEAR_COUNT,
  MOCK_BAND_OVER_COUNT,
  MOCK_EMAILS_NEAR_SENT,
  MOCK_EMAILS_OUT_SENT,
  MOCK_SENT_THIS_MONTH,
  MOCK_SUBSCRIBER_COUNT,
  MOCK_SUBSCRIBERS_ALLOWANCE,
  MOCK_SUBSCRIBERS_BAND_CEILING,
  MOCK_SUBSCRIBERS_LIMITS,
} from '@platform/testing/subscribers/fixtures';
import type { TNewsletterLimits } from '@shinefold/db/queries/email-usage';

import { toSubscriberLimits } from './subscriber-limits';

const UNDER_LIMITS = MOCK_SUBSCRIBERS_LIMITS;
const BAND_NEAR_LIMITS = { ...UNDER_LIMITS, activeCount: MOCK_BAND_NEAR_COUNT };
const BAND_OVER_LIMITS = { ...UNDER_LIMITS, activeCount: MOCK_BAND_OVER_COUNT };
const EMAILS_NEAR_LIMITS = {
  ...UNDER_LIMITS,
  sentThisMonth: MOCK_EMAILS_NEAR_SENT,
};
const EMAILS_OUT_LIMITS = {
  ...UNDER_LIMITS,
  sentThisMonth: MOCK_EMAILS_OUT_SENT,
};

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
      { ...EMAILS_OUT_LIMITS, activeCount: MOCK_BAND_OVER_COUNT },
      {},
      SUBSCRIBERS_NOTICE.BAND_PAUSED,
    ],
    [
      'out of emails before a near band',
      { ...EMAILS_OUT_LIMITS, activeCount: MOCK_BAND_NEAR_COUNT },
      {},
      SUBSCRIBERS_NOTICE.EMAILS_PAUSED,
    ],
    [
      'a near band before near emails',
      { ...EMAILS_NEAR_LIMITS, activeCount: MOCK_BAND_NEAR_COUNT },
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
    [
      'a near notice before a move up',
      BAND_NEAR_LIMITS,
      { hasMovedUp: true },
      SUBSCRIBERS_NOTICE.BAND_NEAR,
    ],
  ] as const)('shows %s', (_, limits, overrides, notice) => {
    expect(limitsFor(limits, overrides).notice).toBe(notice);
  });

  it('marks only the band card paused when the band notice shows', () => {
    const { band, emails } = limitsFor({
      ...EMAILS_OUT_LIMITS,
      activeCount: MOCK_BAND_OVER_COUNT,
    });

    expect(band.state).toBe(SUBSCRIBER_LIMIT_STATE.PAUSED);
    expect(band.over).toBe(
      MOCK_BAND_OVER_COUNT - MOCK_SUBSCRIBERS_BAND_CEILING,
    );
    expect(emails.state).toBe(SUBSCRIBER_LIMIT_STATE.NEAR);
  });

  it('marks the emails card paused when the month notice shows', () => {
    const { emails } = limitsFor(EMAILS_OUT_LIMITS);

    expect(emails.state).toBe(SUBSCRIBER_LIMIT_STATE.PAUSED);
    expect(emails.left).toBe(MOCK_SUBSCRIBERS_ALLOWANCE - MOCK_EMAILS_OUT_SENT);
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
