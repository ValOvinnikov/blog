import { LOCALE_BCP47_TAGS, routes } from '@blog/config';
import { routing } from '@web/i18n/routing';
import { toMetadata } from '@web/metadata/to-metadata';
import { getLandingPage } from '@web/server/landing/get-landing-page/get-landing-page';
import { getRequestContext } from '@web/server/request-context/request-context';
import { logger } from '@web/utils/logger/logger';
import { toLiveLanguagePages } from '@web/utils/to-live-language-pages';
import { toLocalizedPathname } from '@web/utils/to-localized-pathname';
import { withLanguageAlternates } from '@web/utils/with-language-alternates';
import type { Metadata } from 'next';

export const buildLandingPageMetadata = async (
  path: string,
): Promise<Metadata> => {
  const result = await getLandingPage(path);

  if (!result.ok) {
    logger.error('landing_page_metadata.fetch_failed', {
      path,
      error: result.error,
    });
    return {};
  }

  if (!result.data) {
    return {};
  }

  const { seo, translations } = result.data;
  const {
    locale,
    defaultLocale = routing.defaultLocale,
    liveLocales = [locale],
  } = await getRequestContext();
  const canonical = toLocalizedPathname({
    href: routes.landingPage(path),
    locale,
    defaultLocale,
  });
  const metadata = await toMetadata(seo, { canonical, ogType: 'website' });

  const alternateLocales = toLiveLanguagePages({
    pages: translations,
    liveLocales,
  })
    .filter(({ language }) => language !== locale)
    .map(({ language }) => LOCALE_BCP47_TAGS[language]);

  return withLanguageAlternates(
    {
      ...metadata,
      openGraph: {
        ...metadata.openGraph,
        locale: LOCALE_BCP47_TAGS[locale],
        url: canonical,
        ...(alternateLocales.length > 0 && {
          alternateLocale: alternateLocales,
        }),
      },
    },
    {
      pages: translations.map(({ language, slug: translatedPath }) => ({
        language,
        href: routes.landingPage(translatedPath),
      })),
      locale,
      liveLocales,
      defaultLocale,
    },
  );
};
