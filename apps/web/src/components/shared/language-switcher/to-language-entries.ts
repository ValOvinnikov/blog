import {
  LOCALE_BCP47_TAGS,
  LOCALE_NATIVE_LABEL,
  type TLocaleIsoCode,
} from '@blog/config';
import { toLanguageSwitcherLink } from '@web/utils/to-language-switcher-link/to-language-switcher-link';

export type TLanguageEntry = {
  locale: TLocaleIsoCode;
  href: string;
  hrefLang: string;
  lang: string;
  label: string;
  code: string;
  isCurrent: boolean;
};

type TLanguageEntriesParams = {
  liveLocales: readonly TLocaleIsoCode[];
  currentLocale: TLocaleIsoCode;
  defaultLocale: TLocaleIsoCode;
  pathname: string;
};

export const toLanguageEntries = ({
  liveLocales,
  currentLocale,
  defaultLocale,
  pathname,
}: TLanguageEntriesParams): TLanguageEntry[] =>
  liveLocales.map((locale) => {
    const { href, hrefLocale } = toLanguageSwitcherLink({
      locale,
      currentLocale,
      defaultLocale,
      pathname,
    });

    return {
      locale,
      href,
      hrefLang: LOCALE_BCP47_TAGS[hrefLocale],
      lang: LOCALE_BCP47_TAGS[locale],
      label: LOCALE_NATIVE_LABEL[locale],
      code: LOCALE_BCP47_TAGS[locale].toUpperCase(),
      isCurrent: locale === currentLocale,
    };
  });
