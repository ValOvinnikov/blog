import {
  LOCALE_BCP47_TAGS,
  LOCALE_NATIVE_LABEL,
  routes,
  type TLocaleIsoCode,
} from '@blog/config';
import { toLocalizedPathname } from '@web/utils/to-localized-pathname';

export type TLanguageEntry = {
  locale: TLocaleIsoCode;
  href: string;
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
}: TLanguageEntriesParams): TLanguageEntry[] => {
  const currentPath = toLocalizedPathname({
    href: pathname,
    locale: currentLocale,
    defaultLocale,
  });

  return liveLocales.map((locale) => ({
    locale,
    href: routes.switchLanguage(locale, currentPath),
    lang: LOCALE_BCP47_TAGS[locale],
    label: LOCALE_NATIVE_LABEL[locale],
    code: LOCALE_BCP47_TAGS[locale].toUpperCase(),
    isCurrent: locale === currentLocale,
  }));
};
