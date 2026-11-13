import type { TMaybeUndefined } from '@blog/config/types';
import {
  NEWSLETTER_LIMIT_NOTICE_KIND,
  NEWSLETTER_SKIP_REASON,
  type TNewsletterLimitNoticeKind,
  type TNewsletterSkipReason,
} from '@blog/db/constants';
import { NEWSLETTER_LIMIT_NEAR_RATIO } from '@worker/constants/newsletter-send';

export type TNewsletterLimits = {
  activeCount: number;
  bandCeiling: number;
  allowance: number;
  sentThisMonth: number;
};

export function sentAfterThisPost({
  activeCount,
  sentThisMonth,
}: TNewsletterLimits): number {
  return sentThisMonth + activeCount;
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
