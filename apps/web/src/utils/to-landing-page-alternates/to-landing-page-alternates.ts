import { routes, type TLocaleIsoCode } from '@blog/config';
import type { TPageTranslation } from '@blog/service';
import { toLanguageAlternates } from '@web/utils/to-language-alternates';

type TLandingPageAlternatesParams = {
  translations: readonly TPageTranslation[];
  defaultLocale: TLocaleIsoCode;
};

export const toLandingPageAlternates = ({
  translations,
  defaultLocale,
}: TLandingPageAlternatesParams): Record<string, string> =>
  toLanguageAlternates({
    pages: translations.map(({ language, slug }) => ({
      language,
      href: routes.landingPage(slug),
    })),
    defaultLocale,
  });
