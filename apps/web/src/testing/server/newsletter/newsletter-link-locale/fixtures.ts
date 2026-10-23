import { LOCALE_ISO_CODES } from '@blog/config';
import type { TNewsletterLinkLocale } from '@web/server/newsletter/newsletter-link-locale/newsletter-link-locale';

export const mockNewsletterLinkLocale = (
  overrides: Partial<TNewsletterLinkLocale> = {},
): TNewsletterLinkLocale => ({
  locale: LOCALE_ISO_CODES.EN,
  defaultLocale: LOCALE_ISO_CODES.EN,
  ...overrides,
});
