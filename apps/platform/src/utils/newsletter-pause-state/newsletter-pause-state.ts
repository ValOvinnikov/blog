import type { TNewsletterLimits } from '@shinefold/db/queries/email-usage';

export const monthlyEmailsLeft = ({
  allowance,
  sentThisMonth,
}: TNewsletterLimits): number => Math.max(0, allowance - sentThisMonth);

export const isOverSubscriberBand = ({
  activeCount,
  bandCeiling,
}: TNewsletterLimits): boolean => activeCount > bandCeiling;

export const isOutOfMonthlyEmails = (limits: TNewsletterLimits): boolean =>
  limits.activeCount > monthlyEmailsLeft(limits);
