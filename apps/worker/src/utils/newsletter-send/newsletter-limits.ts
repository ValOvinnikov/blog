import {
  NEWSLETTER_SKIP_REASON,
  type TNewsletterSkipReason,
} from '@shinefold/config/constants';
import type { TMaybeUndefined } from '@shinefold/config/types';
import {
  NEWSLETTER_LIMIT_NOTICE_KIND,
  type TNewsletterLimitNoticeKind,
} from '@shinefold/db/constants';
import type { TNewsletterLimits } from '@shinefold/db/queries/email-usage';
import { NEWSLETTER_LIMIT_NEAR_RATIO } from '@worker/constants/newsletter-send';

export function sentAfterThisPost({
  activeCount,
  sentThisMonth,
}: TNewsletterLimits): number {
  return sentThisMonth + activeCount;
}

export function allowanceResetDate(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}

export function allowanceLeft({
  allowance,
  sentThisMonth,
}: TNewsletterLimits): number {
  return Math.max(0, allowance - sentThisMonth);
}

export function newsletterSkipReason(
  limits: TNewsletterLimits,
): TMaybeUndefined<TNewsletterSkipReason> {
  if (limits.activeCount > limits.bandCeiling) {
    return NEWSLETTER_SKIP_REASON.OVER_SUBSCRIBER_BAND;
  }
  if (sentAfterThisPost(limits) > limits.allowance) {
    return NEWSLETTER_SKIP_REASON.OVER_MONTHLY_ALLOWANCE;
  }
  return undefined;
}

export function nearLimitNotices(
  limits: TNewsletterLimits,
): TNewsletterLimitNoticeKind[] {
  const { activeCount, bandCeiling, allowance } = limits;
  return [
    activeCount >= bandCeiling * NEWSLETTER_LIMIT_NEAR_RATIO &&
      NEWSLETTER_LIMIT_NOTICE_KIND.SUBSCRIBER_BAND_NEAR,
    sentAfterThisPost(limits) >= allowance * NEWSLETTER_LIMIT_NEAR_RATIO &&
      NEWSLETTER_LIMIT_NOTICE_KIND.MONTHLY_ALLOWANCE_NEAR,
  ].filter((kind) => kind !== false);
}
