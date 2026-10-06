import { routes } from '@blog/config';
import { toLocalizedPageMetadata } from '@web/metadata/to-localized-page-metadata';
import { getTopicPage } from '@web/server/topic/get-topic-page/get-topic-page';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

/** Page 2+ self-canonicalizes and carries no hreflang: each language's list need not run to the same number of pages. */
export const buildTopicMetadata = async (
  slug: string,
  pageNumber?: number,
): Promise<Metadata> => {
  const [result, t] = await Promise.all([
    getTopicPage(slug),
    getTranslations('pagination'),
  ]);

  if (!result.ok) {
    logger.error('topic_metadata.fetch_failed', {
      slug,
      error: result.error,
    });
    return {};
  }

  if (!result.data) {
    return {};
  }

  const { seo, translations } = result.data;
  const resolvedSeo =
    pageNumber === undefined
      ? seo
      : {
          ...seo,
          title: `${seo.title} ${t('pageSuffix', { page: pageNumber })}`,
          ogTitle: seo.ogTitle
            ? `${seo.ogTitle} ${t('pageSuffix', { page: pageNumber })}`
            : undefined,
        };

  return toLocalizedPageMetadata(resolvedSeo, {
    href: routes.topic(slug, pageNumber),
    translations:
      pageNumber === undefined
        ? translations.map(({ language, slug: translatedSlug }) => ({
            language,
            href: routes.topic(translatedSlug),
          }))
        : [],
    ogType: 'website',
  });
};
