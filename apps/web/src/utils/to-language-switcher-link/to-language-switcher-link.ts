import { LOCALE_BCP47_TAGS, type TLocaleIsoCode } from '@blog/config';

type TLanguageSwitcherLinkParams = {
  locale: TLocaleIsoCode;
  currentLocale: TLocaleIsoCode;
  defaultLocale: TLocaleIsoCode;
  pathname: string;
};

type TLanguageSwitcherLink = {
  href: string;
  hrefLocale: TLocaleIsoCode;
};

const toLocalizedPath = (
  locale: TLocaleIsoCode,
  defaultLocale: TLocaleIsoCode,
  pathname: string,
) => {
  if (locale === defaultLocale) {
    return pathname;
  }

  const prefix = `/${LOCALE_BCP47_TAGS[locale]}`;

  return pathname === '/' ? prefix : `${prefix}${pathname}`;
};

export const toLanguageSwitcherLink = ({
  locale,
  currentLocale,
  defaultLocale,
  pathname,
}: TLanguageSwitcherLinkParams): TLanguageSwitcherLink => {
  const hrefLocale = locale === currentLocale ? locale : defaultLocale;

  return {
    href: toLocalizedPath(hrefLocale, defaultLocale, pathname),
    hrefLocale,
  };
};
