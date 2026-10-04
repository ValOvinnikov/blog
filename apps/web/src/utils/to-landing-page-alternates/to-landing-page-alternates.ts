import { LOCALE_BCP47_TAGS, routes, type TLocaleIsoCode } from '@blog/config';
import type { TPageTranslation } from '@blog/service';
import { toLocalizedPathname } from '@web/utils/to-localized-pathname';

type TLandingPageAlternatesParams = {
  translations: readonly TPageTranslation[];
  defaultLocale: TLocaleIsoCode;
};

export const toLandingPageAlternates = ({
  translations,
  defaultLocale,
}: TLandingPageAlternatesParams): Record<string, string> => {
  const pathFor = ({ language, slug }: TPageTranslation) =>
    toLocalizedPathname({
      href: routes.landingPage(slug),
      locale: language,
      defaultLocale,
    });
  const defaultTranslation = translations.find(
    ({ language }) => language === defaultLocale,
  );

  return {
    ...Object.fromEntries(
      translations.map((translation) => [
        LOCALE_BCP47_TAGS[translation.language],
        pathFor(translation),
      ]),
    ),
    ...(defaultTranslation && { 'x-default': pathFor(defaultTranslation) }),
  };
};
