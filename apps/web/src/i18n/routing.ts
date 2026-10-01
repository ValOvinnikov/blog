import {
  LOCALE_BCP47_TAGS,
  LOCALE_ISO_CODES,
  type TLocaleIsoCode,
} from '@blog/config';
import { defineRouting } from 'next-intl/routing';

const LOCALE_PREFIXES = {
  EN: `/${LOCALE_BCP47_TAGS.EN}`,
  NL: `/${LOCALE_BCP47_TAGS.NL}`,
  FR: `/${LOCALE_BCP47_TAGS.FR}`,
  DE: `/${LOCALE_BCP47_TAGS.DE}`,
  ES: `/${LOCALE_BCP47_TAGS.ES}`,
} as const satisfies Record<TLocaleIsoCode, `/${string}`>;

export const buildTenantRouting = (
  defaultLocale: TLocaleIsoCode,
  liveLocales: readonly TLocaleIsoCode[],
) =>
  defineRouting({
    locales: liveLocales,
    defaultLocale,
    localePrefix: { mode: 'as-needed', prefixes: LOCALE_PREFIXES },
    localeDetection: false,
  });

export const routing = buildTenantRouting(
  LOCALE_ISO_CODES.EN,
  Object.values(LOCALE_ISO_CODES),
);

export const localeForPrefix = (segment: string): TLocaleIsoCode | undefined =>
  Object.values(LOCALE_ISO_CODES).find(
    (locale) => LOCALE_BCP47_TAGS[locale] === segment.toLowerCase(),
  );
