import {
  MOCK_EMAILS_LEFT,
  MOCK_NEWSLETTER_LIMITS,
} from '@platform/testing/newsletter-post-send/fixtures';
import {
  NEWSLETTER_SEND_NOW_REFUSAL,
  NEWSLETTER_SKIP_REASON,
  type TNewsletterSkipReason,
} from '@shinefold/config';
import { NEWSLETTER_POST_SEND_OUTCOME } from '@shinefold/db/constants';
import { mockNewsletterPostSend } from '@shinefold/db/testing/newsletter-post-sends/fixtures';

import {
  isHandSendableClaim,
  toSendNowEligibility,
  toSendNowRefusal,
  type TSendNowFacts,
} from './newsletter-send-now-eligibility';

const MOCK_RESETS_AT = new Date('2026-12-01T00:00:00.000Z');

const FACTS: TSendNowFacts = {
  sendingOffCause: undefined,
  isSendingStopped: false,
  limits: MOCK_NEWSLETTER_LIMITS,
  resetsAt: MOCK_RESETS_AT,
};

const skippedFor = (skipReason: TNewsletterSkipReason) =>
  mockNewsletterPostSend({
    outcome: NEWSLETTER_POST_SEND_OUTCOME.SKIPPED,
    skipReason,
  });

describe(isHandSendableClaim, () => {
  it('accepts a post with no claim', () => {
    expect(isHandSendableClaim(undefined)).toBe(true);
  });

  it.each([
    NEWSLETTER_SKIP_REASON.OVER_SUBSCRIBER_BAND,
    NEWSLETTER_SKIP_REASON.OVER_MONTHLY_ALLOWANCE,
    NEWSLETTER_SKIP_REASON.NEWSLETTER_OFF,
    NEWSLETTER_SKIP_REASON.SENDING_OFF,
  ])('accepts a post skipped for %s', (skipReason) => {
    expect(isHandSendableClaim(skippedFor(skipReason))).toBe(true);
  });

  it.each([
    NEWSLETTER_SKIP_REASON.NOT_IN_PLAN,
    NEWSLETTER_SKIP_REASON.SITE_INACTIVE,
    NEWSLETTER_SKIP_REASON.SITE_PAUSED,
    NEWSLETTER_SKIP_REASON.REPUTATION_STOP,
  ])('refuses a post skipped for %s', (skipReason) => {
    expect(isHandSendableClaim(skippedFor(skipReason))).toBe(false);
  });

  it('refuses a post that is sending or sent', () => {
    expect(isHandSendableClaim(mockNewsletterPostSend())).toBe(false);
    expect(
      isHandSendableClaim(
        mockNewsletterPostSend({ outcome: NEWSLETTER_POST_SEND_OUTCOME.SENT }),
      ),
    ).toBe(false);
  });
});

describe(toSendNowEligibility, () => {
  it('offers the send, with the emails left, once the cause is gone', () => {
    expect(toSendNowEligibility(FACTS)).toEqual({
      isOffered: true,
      emailsLeft: MOCK_EMAILS_LEFT,
    });
  });

  it.each([
    NEWSLETTER_SKIP_REASON.NOT_IN_PLAN,
    NEWSLETTER_SKIP_REASON.SITE_INACTIVE,
  ])('never offers the send on a site whose cause is %s', (sendingOffCause) => {
    expect(toSendNowEligibility({ ...FACTS, sendingOffCause })).toEqual({
      isOffered: false,
    });
  });

  it('never offers the send while the site is paused or stopped', () => {
    expect(toSendNowEligibility({ ...FACTS, isSendingStopped: true })).toEqual({
      isOffered: false,
    });
  });

  it.each([
    NEWSLETTER_SKIP_REASON.NEWSLETTER_OFF,
    NEWSLETTER_SKIP_REASON.SENDING_OFF,
  ])('disables the send while the cause is %s', (sendingOffCause) => {
    expect(toSendNowEligibility({ ...FACTS, sendingOffCause })).toEqual({
      isOffered: true,
      disabledBy: sendingOffCause,
    });
  });

  it('disables the send while the site is over its band', () => {
    const limits = { ...FACTS.limits, activeCount: 2_501 };

    expect(toSendNowEligibility({ ...FACTS, limits })).toEqual({
      isOffered: true,
      disabledBy: NEWSLETTER_SEND_NOW_REFUSAL.OVER_BAND,
      bandCeiling: MOCK_NEWSLETTER_LIMITS.bandCeiling,
    });
  });

  it("disables the send while the month's emails left don't cover every subscriber", () => {
    const limits = { ...FACTS.limits, sentThisMonth: 14_950 };

    expect(toSendNowEligibility({ ...FACTS, limits })).toEqual({
      isOffered: true,
      disabledBy: NEWSLETTER_SEND_NOW_REFUSAL.OVER_MONTH,
      emailsNeeded: MOCK_NEWSLETTER_LIMITS.activeCount,
      emailsLeft: 50,
      resetsAt: MOCK_RESETS_AT.toISOString(),
    });
  });

  it('names the first cause that applies', () => {
    const limits = { ...FACTS.limits, activeCount: 20_000 };

    expect(
      toSendNowEligibility({
        ...FACTS,
        sendingOffCause: NEWSLETTER_SKIP_REASON.SENDING_OFF,
        limits,
      }),
    ).toEqual({
      isOffered: true,
      disabledBy: NEWSLETTER_SKIP_REASON.SENDING_OFF,
    });
  });
});

describe(toSendNowRefusal, () => {
  it('admits an offered, enabled send', () => {
    expect(
      toSendNowRefusal(undefined, { isOffered: true, emailsLeft: 10 }),
    ).toBeUndefined();
  });

  it('refuses a post that has started sending or was sent', () => {
    expect(
      toSendNowRefusal(mockNewsletterPostSend(), { isOffered: false }),
    ).toBe(NEWSLETTER_SEND_NOW_REFUSAL.ALREADY_SENT);
  });

  it('refuses a post that is never offered the send', () => {
    expect(
      toSendNowRefusal(skippedFor(NEWSLETTER_SKIP_REASON.REPUTATION_STOP), {
        isOffered: false,
      }),
    ).toBe(NEWSLETTER_SEND_NOW_REFUSAL.NOT_ELIGIBLE);
  });

  it('refuses with the cause while it is still there', () => {
    expect(
      toSendNowRefusal(skippedFor(NEWSLETTER_SKIP_REASON.NEWSLETTER_OFF), {
        isOffered: true,
        disabledBy: NEWSLETTER_SEND_NOW_REFUSAL.NEWSLETTER_OFF,
      }),
    ).toBe(NEWSLETTER_SEND_NOW_REFUSAL.NEWSLETTER_OFF);
  });
});
