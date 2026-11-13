import type { TOwnerEmailText } from '@worker/utils/owner-email/owner-email-copy-types';

type TOwnerNewsletterCopyInput = {
  siteName: string;
  activeCount: string;
  bandCeiling: string;
  allowance: string;
  sentAfterThisPost: string;
  nearPercent: string;
  isOverBand: boolean;
};

export type TOwnerNewsletterText = (
  input: TOwnerNewsletterCopyInput,
) => Pick<TOwnerEmailText, 'subject' | 'paragraphs'>;
