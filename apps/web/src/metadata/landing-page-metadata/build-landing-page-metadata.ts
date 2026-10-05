import { LOCALE_BCP47_TAGS, routes } from '@blog/config';
import { routing } from '@web/i18n/routing';
import { toMetadata } from '@web/metadata/to-metadata';
import { getLandingPage } from '@web/server/landing/get-landing-page/get-landing-page';
import { getRequestContext } from '@web/server/request-context/request-context';
import { logger } from '@web/utils/logger/logger';
import { toLandingPageAlternates } from '@web/utils/to-landing-page-alternates';
import { toLocalizedPathname } from '@web/utils/to-localized-pathname';
import type { Metadata } from 'next';

export const buildLandingPageMetadata = async (
  slug: string,
): Promise<Metadata> => {
  const result = await getLandingPage(slug);

  if (!result.ok) {
    logger.error('landing_page_metadata.fetch_failed', {
      slug,
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
    href: routes.landingPage(slug),
    locale,
    defaultLocale,
  });
  const metadata = await toMetadata(seo, { canonical, ogType: 'website' });

  const liveTranslations = translations.filter(({ language }) =>
    liveLocales.includes(language),
  );
  const alternateLocales = liveTranslations
    .filter(({ language }) => language !== locale)
    .map(({ language }) => LOCALE_BCP47_TAGS[language]);

  const localizedMetadata: Metadata = {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      locale: LOCALE_BCP47_TAGS[locale],
      url: canonical,
      ...(alternateLocales.length > 0 && {
        alternateLocale: alternateLocales,
      }),
    },
  };

  if (liveTranslations.every(({ language }) => language === locale)) {
    return localizedMetadata;
  }

  return {
    ...localizedMetadata,
    alternates: {
      ...metadata.alternates,
      languages: toLandingPageAlternates({
        translations: liveTranslations,
        defaultLocale,
      }),
    },
  };
};
