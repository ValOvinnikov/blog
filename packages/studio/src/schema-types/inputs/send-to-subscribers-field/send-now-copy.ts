import {
  NEWSLETTER_SEND_NOW_REFUSAL,
  type TNewsletterSendNowEligibility,
} from '@shinefold/config';
import type { TMaybeUndefined } from '@shinefold/config/types';
import {
  formatSendCount,
  formatSendUtcDay,
  formatSubscribers,
} from '@shinefold/studio/schema-types/inputs/send-to-subscribers-field/send-status-format';

type TOfferedSendNow = Extract<
  TNewsletterSendNowEligibility,
  { isOffered: true }
>;

export const SEND_EMAILS_LABEL = 'Send emails';

export const CANCEL_LABEL = 'Cancel';

export const SEND_NOW_REFUSED_TOAST = "This post can't be sent right now.";

export const sendNowDisabledReason = (
  eligibility: TOfferedSendNow,
): TMaybeUndefined<string> => {
  switch (eligibility.disabledBy) {
    case undefined:
      return undefined;
    case NEWSLETTER_SEND_NOW_REFUSAL.NEWSLETTER_OFF:
      return 'Turn on Newsletter in Features to send this.';
    case NEWSLETTER_SEND_NOW_REFUSAL.SENDING_OFF:
      return 'Turn on emailing posts in Subscribers to send this.';
    case NEWSLETTER_SEND_NOW_REFUSAL.OVER_BAND:
      return `Your site is over its ${formatSendCount(eligibility.bandCeiling)}-subscriber band.`;
    case NEWSLETTER_SEND_NOW_REFUSAL.OVER_MONTH:
      return `This needs ${formatSendCount(eligibility.emailsNeeded)} emails and ${formatSendCount(eligibility.emailsLeft)} are left until ${formatSendUtcDay(eligibility.resetsAt)}.`;
  }
};

export const sendNowConfirmCopy = (
  confirmedCount: number,
  emailsLeft: number,
) => ({
  title: `Email this post to ${formatSubscribers(confirmedCount)}?`,
  body: `This uses ${formatSendCount(confirmedCount)} of the ${formatSendCount(emailsLeft)} emails left this month. It sends once and can't be sent again.`,
});

export const sendNowStartedToast = (confirmedCount: number): string =>
  `Sending to ${formatSubscribers(confirmedCount)}.`;
