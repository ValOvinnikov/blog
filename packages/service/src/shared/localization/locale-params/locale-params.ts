import { LOCALE_ISO_CODES, type TLocaleIsoCode } from '@blog/config/constants';
import type { TTenantSanityContext } from '@blog/service/sanity/client';

export type TLocaleParams = {
  locale: TLocaleIsoCode;
  defaultLocale: TLocaleIsoCode;
};

export function buildLocaleParams({
  locale,
  defaultLocale = LOCALE_ISO_CODES.EN,
}: TTenantSanityContext): TLocaleParams {
  return { locale: locale ?? defaultLocale, defaultLocale };
}
