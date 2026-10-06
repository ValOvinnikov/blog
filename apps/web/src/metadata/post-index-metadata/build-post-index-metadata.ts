import { routes } from '@blog/config';
import { toLocalizedPageMetadata } from '@web/metadata/to-localized-page-metadata';
import { getPostIndexPage } from '@web/server/post-index/get-post-index-page/get-post-index-page';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

/** Page 2+ carries no hreflang: each language's list need not run to the same number of pages. */
export const buildPostIndexMetadata = async (
  page: number,
): Promise<Metadata> => {
  const [result, t] = await Promise.all([
    getPostIndexPage(),
    getTranslations('pagination'),
  ]);

  if (!result.ok) {
    logger.error('post_index_metadata.fetch_failed', {
      page,
      error: result.error,
    });
    return {};
  }

  if (!result.data) {
    return {};
  }

  const { seo, translations } = result.data;
  const resolvedSeo =
    page === 1
      ? seo
      : {
          ...seo,
          title: `${seo.title} ${t('pageSuffix', { page })}`,
          ogTitle: seo.ogTitle
            ? `${seo.ogTitle} ${t('pageSuffix', { page })}`
            : undefined,
        };

  return toLocalizedPageMetadata(resolvedSeo, {
    href: routes.blogIndex(page),
    translations: page === 1 ? translations : [],
    ogType: 'website',
    feedUrl: routes.rssFeed(),
  });
};
