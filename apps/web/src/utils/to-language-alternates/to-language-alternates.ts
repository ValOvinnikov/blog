import { LOCALE_BCP47_TAGS, type TLocaleIsoCode } from '@blog/config';
import { toLocalizedPathname } from '@web/utils/to-localized-pathname';

export type TLanguagePage = { language: TLocaleIsoCode; href: string };

type TLanguageAlternatesParams = {
  pages: readonly TLanguagePage[];
  defaultLocale: TLocaleIsoCode;
};

export const toLanguageAlternates = ({
  pages,
  defaultLocale,
}: TLanguageAlternatesParams): Record<string, string> => {
  const pathFor = ({ language, href }: TLanguagePage) =>
    toLocalizedPathname({ href, locale: language, defaultLocale });
  const defaultPage = pages.find(({ language }) => language === defaultLocale);

  return {
    ...Object.fromEntries(
      pages.map((page) => [LOCALE_BCP47_TAGS[page.language], pathFor(page)]),
    ),
    ...(defaultPage && { 'x-default': pathFor(defaultPage) }),
  };
};
