import type { TBillingInterval } from '@shinefold/config/constants';
import type { TMaybeUndefined } from '@shinefold/config/types';
import type { TOwnerNewsletterEmail } from '@worker/constants/owner-email';

export type TOwnerNewsletterMoveUp = {
  ceiling: string;
  extra: string;
};

type TOwnerNewsletterCopyInput = {
  siteName: string;
  activeCount: string;
  bandCeiling: string;
  allowance: string;
  sent: string;
  resetDate: string;
  postTitle: string;
  moveUp: TMaybeUndefined<TOwnerNewsletterMoveUp>;
};

type TOwnerNewsletterText = {
  subject: string;
  heading: string;
  paragraphs: string[];
  closingLine: TMaybeUndefined<string>;
};

export type TOwnerNewsletterEmailCopy = {
  subscribersLabel: string;
  emailsLabel: string;
  usageValue: (used: string, limit: string) => string;
  extraPrice: Record<TBillingInterval, (price: string) => string>;
  actionLabel: string;
  footerLine: (siteName: string) => string;
  reputationPaused: (siteName: string) => TOwnerNewsletterText;
  emails: Record<
    TOwnerNewsletterEmail,
    (input: TOwnerNewsletterCopyInput) => TOwnerNewsletterText
  >;
};
