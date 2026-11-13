import { LOCALE_ISO_CODES, type TLocaleIsoCode } from '@blog/config/constants';

import { OWNER_GRACE_EMAIL_COPY_DE } from './de';
import { OWNER_GRACE_EMAIL_COPY_EN } from './en';
import { OWNER_GRACE_EMAIL_COPY_ES } from './es';
import { OWNER_GRACE_EMAIL_COPY_FR } from './fr';
import { OWNER_GRACE_EMAIL_COPY_NL } from './nl';
import type { TOwnerGraceEmailCopy } from './owner-grace-email-copy-type';

export const OWNER_GRACE_EMAIL_COPY = {
  [LOCALE_ISO_CODES.EN]: OWNER_GRACE_EMAIL_COPY_EN,
  [LOCALE_ISO_CODES.NL]: OWNER_GRACE_EMAIL_COPY_NL,
  [LOCALE_ISO_CODES.FR]: OWNER_GRACE_EMAIL_COPY_FR,
  [LOCALE_ISO_CODES.DE]: OWNER_GRACE_EMAIL_COPY_DE,
  [LOCALE_ISO_CODES.ES]: OWNER_GRACE_EMAIL_COPY_ES,
} satisfies Record<TLocaleIsoCode, TOwnerGraceEmailCopy>;
