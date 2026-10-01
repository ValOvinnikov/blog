import { LOCALE_ISO_CODES } from '@blog/config';
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: Object.values(LOCALE_ISO_CODES),
  defaultLocale: LOCALE_ISO_CODES.EN,
  localePrefix: 'never',
});
