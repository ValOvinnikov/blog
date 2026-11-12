import { LOCALE_ISO_CODES, type TLocaleIsoCode } from '@blog/config/constants';
import type { TOwnerEmailText } from '@worker/utils/owner-email/owner-email-copy';

type TOwnerNewsletterCopyInput = {
  siteName: string;
  activeCount: string;
  bandCeiling: string;
  allowance: string;
  sentAfterThisPost: string;
  isOverBand: boolean;
};

export type TOwnerNewsletterText = (
  input: TOwnerNewsletterCopyInput,
) => Pick<TOwnerEmailText, 'subject' | 'paragraphs'>;

export const OWNER_NEWSLETTER_ACTION_LABEL = {
  [LOCALE_ISO_CODES.EN]: 'Open your dashboard',
  [LOCALE_ISO_CODES.NL]: 'Open je dashboard',
  [LOCALE_ISO_CODES.FR]: 'Ouvrir votre tableau de bord',
  [LOCALE_ISO_CODES.DE]: 'Dashboard öffnen',
  [LOCALE_ISO_CODES.ES]: 'Abrir tu panel',
} satisfies Record<TLocaleIsoCode, string>;
