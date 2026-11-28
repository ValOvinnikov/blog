import {
  NEWSLETTER_SEND_STATUS,
  NEWSLETTER_SKIP_REASON,
  type TMaybeUndefined,
  type TNewsletterPostSendState,
} from '@shinefold/config';
import { NEWSLETTER_POST_SEND_OUTCOME } from '@shinefold/db/constants';
import type { INewsletterPostSend } from '@shinefold/db/queries/newsletter-post-sends';
import { isUndefined } from '@shinefold/utils/primitives';

const toSkippedState = (
  { skipReason, bandCeiling: skipBandCeiling }: INewsletterPostSend,
  siteBandCeiling: TMaybeUndefined<number>,
): TNewsletterPostSendState => {
  if (!skipReason) {
    throw new Error('A skipped post send has no skip reason.');
  }
  if (skipReason !== NEWSLETTER_SKIP_REASON.OVER_SUBSCRIBER_BAND) {
    return { status: NEWSLETTER_SEND_STATUS.SKIPPED, skipReason };
  }
  const bandCeiling = skipBandCeiling ?? siteBandCeiling;
  if (isUndefined(bandCeiling)) {
    throw new Error('A band skip needs the band it was measured against.');
  }
  return { status: NEWSLETTER_SEND_STATUS.SKIPPED, skipReason, bandCeiling };
};

export const toNewsletterPostSendState = (
  claim: TMaybeUndefined<INewsletterPostSend>,
  bandCeiling: TMaybeUndefined<number>,
  now: Date,
): TNewsletterPostSendState => {
  if (!claim) return { status: NEWSLETTER_SEND_STATUS.NONE };

  const { outcome, recipientCount, sentCount, scheduledFor, settledAt } = claim;
  if (outcome === NEWSLETTER_POST_SEND_OUTCOME.SENT) {
    return {
      status: NEWSLETTER_SEND_STATUS.SENT,
      recipients: recipientCount ?? sentCount,
      settledAt: (settledAt ?? claim.claimedAt).toISOString(),
    };
  }
  if (outcome === NEWSLETTER_POST_SEND_OUTCOME.SKIPPED) {
    return toSkippedState(claim, bandCeiling);
  }
  if (outcome === NEWSLETTER_POST_SEND_OUTCOME.FAILED) {
    return {
      status: NEWSLETTER_SEND_STATUS.FAILED,
      sent: sentCount,
      recipients: recipientCount,
    };
  }
  if (!isUndefined(recipientCount)) {
    return {
      status: NEWSLETTER_SEND_STATUS.SENDING,
      sent: sentCount,
      recipients: recipientCount,
    };
  }
  if (scheduledFor && scheduledFor > now) {
    return {
      status: NEWSLETTER_SEND_STATUS.SCHEDULED,
      scheduledFor: scheduledFor.toISOString(),
    };
  }
  return { status: NEWSLETTER_SEND_STATUS.SENDING };
};
