import { routes, type TLocaleIsoCode } from '@blog/config';
import type { TPageTranslation } from '@blog/service';
import { toLocalizedPathname } from '@web/utils/to-localized-pathname';

type TLanguageSwitcherLinkParams = {
  locale: TLocaleIsoCode;
  currentLocale: TLocaleIsoCode;
  defaultLocale: TLocaleIsoCode;
  pathname: string;
  translations?: readonly TPageTranslation[];
};

type TLanguageSwitcherLink = {
  href: string;
  hrefLocale: TLocaleIsoCode;
};

export const toLanguageSwitcherLink = ({
  locale,
  currentLocale,
  defaultLocale,
  pathname,
  translations = [],
}: TLanguageSwitcherLinkParams): TLanguageSwitcherLink => {
  const findTranslation = (language: TLocaleIsoCode) =>
    translations.find((translation) => translation.language === language);
  const translation = findTranslation(locale);

  if (translation) {
    return {
      href: toLocalizedPathname({
        href: routes.landingPage(translation.slug),
        locale,
        defaultLocale,
      }),
      hrefLocale: locale,
    };
  }

  const hrefLocale = locale === currentLocale ? locale : defaultLocale;
  const defaultTranslation = findTranslation(defaultLocale);

  return {
    href: toLocalizedPathname({
      href:
        locale !== currentLocale && defaultTranslation
          ? routes.landingPage(defaultTranslation.slug)
          : pathname,
      locale: hrefLocale,
      defaultLocale,
    }),
    hrefLocale,
  };
};
