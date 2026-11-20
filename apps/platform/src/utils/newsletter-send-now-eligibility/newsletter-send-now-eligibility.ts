import {
  NEWSLETTER_HAND_SENDABLE_SKIP_REASONS,
  NEWSLETTER_SEND_NOW_REFUSAL,
  NEWSLETTER_SKIP_REASON,
  type TMaybeUndefined,
  type TNewsletterSendingOffCause,
  type TNewsletterSendNowEligibility,
  type TNewsletterSendNowRefusal,
} from '@shinefold/config';
import { NEWSLETTER_POST_SEND_OUTCOME } from '@shinefold/db/constants';
import type { TNewsletterLimits } from '@shinefold/db/queries/email-usage';
import type { INewsletterPostSend } from '@shinefold/db/queries/newsletter-post-sends';
import { isOneOf } from '@shinefold/utils/primitives';

export type TSendNowFacts = {
  sendingOffCause: TMaybeUndefined<TNewsletterSendingOffCause>;
  isSendingStopped: boolean;
  limits: TNewsletterLimits;
  resetsAt: Date;
};

export const isHandSendableClaim = (
  claim: TMaybeUndefined<INewsletterPostSend>,
): boolean =>
  !claim ||
  (claim.outcome === NEWSLETTER_POST_SEND_OUTCOME.SKIPPED &&
    isOneOf(NEWSLETTER_HAND_SENDABLE_SKIP_REASONS, claim.skipReason));

export const toSendNowEligibility = ({
  sendingOffCause,
  isSendingStopped,
  limits,
  resetsAt,
}: TSendNowFacts): TNewsletterSendNowEligibility => {
  if (
    isSendingStopped ||
    sendingOffCause === NEWSLETTER_SKIP_REASON.NOT_IN_PLAN ||
    sendingOffCause === NEWSLETTER_SKIP_REASON.SITE_INACTIVE
  ) {
    return { isOffered: false };
  }
  if (sendingOffCause) {
    return { isOffered: true, disabledBy: sendingOffCause };
  }

  const { activeCount, bandCeiling, allowance, sentThisMonth } = limits;
  if (activeCount > bandCeiling) {
    return {
      isOffered: true,
      disabledBy: NEWSLETTER_SEND_NOW_REFUSAL.OVER_BAND,
      bandCeiling,
    };
  }

  const emailsLeft = Math.max(0, allowance - sentThisMonth);
  if (activeCount > emailsLeft) {
    return {
      isOffered: true,
      disabledBy: NEWSLETTER_SEND_NOW_REFUSAL.OVER_MONTH,
      emailsNeeded: activeCount,
      emailsLeft,
      resetsAt: resetsAt.toISOString(),
    };
  }
  return { isOffered: true, emailsLeft };
};

export const toSendNowRefusal = (
  claim: TMaybeUndefined<INewsletterPostSend>,
  sendNow: TNewsletterSendNowEligibility,
): TMaybeUndefined<TNewsletterSendNowRefusal> => {
  if (claim && claim.outcome !== NEWSLETTER_POST_SEND_OUTCOME.SKIPPED) {
    return NEWSLETTER_SEND_NOW_REFUSAL.ALREADY_SENT;
  }
  if (!sendNow.isOffered) return NEWSLETTER_SEND_NOW_REFUSAL.NOT_ELIGIBLE;
  return sendNow.disabledBy;
};
