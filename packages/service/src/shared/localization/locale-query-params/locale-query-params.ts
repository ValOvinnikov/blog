import {
  LOCALE_ISO_CODES,
  type TLocaleIsoCode,
} from '@shinefold/config/constants';
import type { TTenantSanityContext } from '@shinefold/service/sanity/client/client';

export type TLocaleQueryParams = {
  locale: TLocaleIsoCode;
  defaultLocale: TLocaleIsoCode;
};

export function buildLocaleQueryParams({
  locale,
  defaultLocale = LOCALE_ISO_CODES.EN,
}: TTenantSanityContext): TLocaleQueryParams {
  return { locale: locale ?? defaultLocale, defaultLocale };
}
