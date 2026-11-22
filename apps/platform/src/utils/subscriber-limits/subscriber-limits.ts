import {
  SUBSCRIBER_LIMIT_STATE,
  SUBSCRIBERS_NOTICE,
  type TSubscriberLimitState,
  type TSubscribersNotice,
} from '@platform/constants/subscribers';
import { USAGE_NEAR_PERCENT } from '@platform/constants/usage';
import {
  isOutOfMonthlyEmails,
  isOverSubscriberBand,
  monthlyEmailsLeft,
} from '@platform/utils/newsletter-pause-state/newsletter-pause-state';
import type { TMaybeUndefined } from '@shinefold/config';
import type { TNewsletterLimits } from '@shinefold/db/queries/email-usage';

const FULL_PERCENT = 100;

export type TSubscriberLimitsInput = {
  limits: TNewsletterLimits;
  isOperatorPaused: boolean;
  hasMovedUp: boolean;
};

type TBandLimit = {
  state: TSubscriberLimitState;
  count: number;
  ceiling: number;
  percent: number;
  left: number;
  over: number;
};

type TEmailsLimit = {
  state: TSubscriberLimitState;
  sent: number;
  allowance: number;
  percent: number;
  left: number;
  postNeeds: number;
  postsLeft: number;
};

export type TSubscriberLimits = {
  notice: TMaybeUndefined<TSubscribersNotice>;
  band: TBandLimit;
  emails: TEmailsLimit;
};

const percentOf = (used: number, limit: number): number =>
  limit > 0 ? Math.floor((used * FULL_PERCENT) / limit) : FULL_PERCENT;

const shownState = (
  percent: number,
  isPausedShown: boolean,
): TSubscriberLimitState => {
  if (isPausedShown) return SUBSCRIBER_LIMIT_STATE.PAUSED;
  return percent >= USAGE_NEAR_PERCENT
    ? SUBSCRIBER_LIMIT_STATE.NEAR
    : SUBSCRIBER_LIMIT_STATE.UNDER;
};

const pickNotice = (
  { isOperatorPaused, hasMovedUp }: TSubscriberLimitsInput,
  isBandOver: boolean,
  isEmailsOut: boolean,
  bandPercent: number,
  emailsPercent: number,
): TMaybeUndefined<TSubscribersNotice> => {
  if (isOperatorPaused) return SUBSCRIBERS_NOTICE.OPERATOR_PAUSE;
  if (isBandOver) return SUBSCRIBERS_NOTICE.BAND_PAUSED;
  if (isEmailsOut) return SUBSCRIBERS_NOTICE.EMAILS_PAUSED;
  if (bandPercent >= USAGE_NEAR_PERCENT) return SUBSCRIBERS_NOTICE.BAND_NEAR;
  if (emailsPercent >= USAGE_NEAR_PERCENT) {
    return SUBSCRIBERS_NOTICE.EMAILS_NEAR;
  }
  return hasMovedUp ? SUBSCRIBERS_NOTICE.MOVED_UP : undefined;
};

export const toSubscriberLimits = (
  input: TSubscriberLimitsInput,
): TSubscriberLimits => {
  const { limits } = input;
  const { activeCount, bandCeiling, sentThisMonth, allowance } = limits;
  const bandPercent = percentOf(activeCount, bandCeiling);
  const emailsPercent = percentOf(sentThisMonth, allowance);
  const notice = pickNotice(
    input,
    isOverSubscriberBand(limits),
    isOutOfMonthlyEmails(limits),
    bandPercent,
    emailsPercent,
  );
  const emailsLeft = monthlyEmailsLeft(limits);

  return {
    notice,
    band: {
      state: shownState(bandPercent, notice === SUBSCRIBERS_NOTICE.BAND_PAUSED),
      count: activeCount,
      ceiling: bandCeiling,
      percent: Math.min(bandPercent, FULL_PERCENT),
      left: Math.max(bandCeiling - activeCount, 0),
      over: Math.max(activeCount - bandCeiling, 0),
    },
    emails: {
      state: shownState(
        emailsPercent,
        notice === SUBSCRIBERS_NOTICE.EMAILS_PAUSED,
      ),
      sent: sentThisMonth,
      allowance,
      percent: Math.min(emailsPercent, FULL_PERCENT),
      left: emailsLeft,
      postNeeds: activeCount,
      postsLeft: activeCount > 0 ? Math.floor(emailsLeft / activeCount) : 0,
    },
  };
};
