import {
  NEWSLETTER_SEND_STATUS,
  NEWSLETTER_SKIP_REASON,
} from '@shinefold/config';
import {
  MOCK_CONFIRMED_COUNT,
  mockNewsletterPostSendStatus,
} from '@shinefold/studio/testing/newsletter-post-send-status';

import { formatSendCount } from './send-status-format';
import { isSendFieldHidden, toSendSwitchView } from './send-switch-view';

const NOT_IN_PLAN_SKIP = {
  status: NEWSLETTER_SEND_STATUS.SKIPPED,
  skipReason: NEWSLETTER_SKIP_REASON.NOT_IN_PLAN,
} as const;

describe(isSendFieldHidden, () => {
  it('hides the field on a plan without Newsletter', () => {
    const status = mockNewsletterPostSendStatus(undefined, {
      sendingOffCause: NEWSLETTER_SKIP_REASON.NOT_IN_PLAN,
    });

    expect(isSendFieldHidden(status)).toBe(true);
  });

  it('keeps a post published without Newsletter hidden after an upgrade', () => {
    const status = mockNewsletterPostSendStatus(NOT_IN_PLAN_SKIP);

    expect(isSendFieldHidden(status)).toBe(true);
  });

  it.each([
    undefined,
    NEWSLETTER_SKIP_REASON.SITE_INACTIVE,
    NEWSLETTER_SKIP_REASON.NEWSLETTER_OFF,
    NEWSLETTER_SKIP_REASON.SENDING_OFF,
  ])('shows the field while the off cause is %s', (sendingOffCause) => {
    const status = mockNewsletterPostSendStatus(undefined, { sendingOffCause });

    expect(isSendFieldHidden(status)).toBe(false);
  });
});

describe(toSendSwitchView, () => {
  it('names the confirmed count on a site that sends', () => {
    const { isDisabled, description } = toSendSwitchView({
      confirmedCount: MOCK_CONFIRMED_COUNT,
      sendingOffCause: undefined,
    });

    expect(isDisabled).toBe(false);
    expect(description).toContain(formatSendCount(MOCK_CONFIRMED_COUNT));
  });

  it('leaves the count out when there are no confirmed subscribers', () => {
    const withNone = toSendSwitchView({
      confirmedCount: 0,
      sendingOffCause: undefined,
    });

    expect(withNone.description).not.toContain(formatSendCount(0));
  });

  it.each([
    NEWSLETTER_SKIP_REASON.SITE_INACTIVE,
    NEWSLETTER_SKIP_REASON.NEWSLETTER_OFF,
    NEWSLETTER_SKIP_REASON.SENDING_OFF,
  ])('disables the switch with its own note while %s', (sendingOffCause) => {
    const sending = toSendSwitchView({
      confirmedCount: MOCK_CONFIRMED_COUNT,
      sendingOffCause: undefined,
    });
    const off = toSendSwitchView({
      confirmedCount: MOCK_CONFIRMED_COUNT,
      sendingOffCause,
    });

    expect(off.isDisabled).toBe(true);
    expect(off.description).not.toBe(sending.description);
  });
});
