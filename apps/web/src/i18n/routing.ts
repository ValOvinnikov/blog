import { LOCALE_ISO_CODES } from '@blog/config';
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: [LOCALE_ISO_CODES.EN],
  defaultLocale: LOCALE_ISO_CODES.EN,
  localePrefix: 'never',
});
