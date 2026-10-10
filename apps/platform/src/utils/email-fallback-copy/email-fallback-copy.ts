import type { TEmailTemplateType, TLocaleIsoCode } from '@blog/config';
import { EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE } from '@blog/db/constants/email-template-defaults';
import type {
  TEmailDraft,
  TEmailFallbackCopy,
} from '@platform/utils/email-draft/email-draft';

export const resolveFallbackCopy = (
  draft: TEmailDraft,
  templateType: TEmailTemplateType,
  locale: TLocaleIsoCode,
  defaultLocale: TLocaleIsoCode,
): TEmailFallbackCopy => {
  const productDefault =
    EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE[locale][templateType];
  const tenantDefault =
    locale === defaultLocale
      ? undefined
      : draft.copies[templateType][defaultLocale];

  return {
    subject: tenantDefault?.subject || productDefault.subject,
    body: tenantDefault?.body ?? productDefault.body,
  };
};
