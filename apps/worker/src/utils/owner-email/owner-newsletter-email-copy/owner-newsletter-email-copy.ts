import {
  LOCALE_ISO_CODES,
  type TLocaleIsoCode,
} from '@shinefold/config/constants';
import type { TOwnerNewsletterEmailCopy } from '@worker/utils/owner-email/owner-newsletter-copy-input';

import { OWNER_NEWSLETTER_EMAIL_COPY_DE } from './de';
import { OWNER_NEWSLETTER_EMAIL_COPY_EN } from './en';
import { OWNER_NEWSLETTER_EMAIL_COPY_ES } from './es';
import { OWNER_NEWSLETTER_EMAIL_COPY_FR } from './fr';
import { OWNER_NEWSLETTER_EMAIL_COPY_NL } from './nl';

export const OWNER_NEWSLETTER_EMAIL_COPY = {
  [LOCALE_ISO_CODES.EN]: OWNER_NEWSLETTER_EMAIL_COPY_EN,
  [LOCALE_ISO_CODES.NL]: OWNER_NEWSLETTER_EMAIL_COPY_NL,
  [LOCALE_ISO_CODES.FR]: OWNER_NEWSLETTER_EMAIL_COPY_FR,
  [LOCALE_ISO_CODES.DE]: OWNER_NEWSLETTER_EMAIL_COPY_DE,
  [LOCALE_ISO_CODES.ES]: OWNER_NEWSLETTER_EMAIL_COPY_ES,
} satisfies Record<TLocaleIsoCode, TOwnerNewsletterEmailCopy>;
