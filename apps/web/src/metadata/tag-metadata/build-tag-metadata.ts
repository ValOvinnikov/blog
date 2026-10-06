import { routes } from '@blog/config';
import { toLocalizedPageMetadata } from '@web/metadata/to-localized-page-metadata';
import { getTagPage } from '@web/server/tag/get-tag-page/get-tag-page';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

/** Page 2+ self-canonicalizes and carries no hreflang: each language's list need not run to the same number of pages. */
export const buildTagMetadata = async (
  slug: string,
  pageNumber?: number,
): Promise<Metadata> => {
  const [result, t] = await Promise.all([
    getTagPage(slug),
    getTranslations('pagination'),
  ]);

  if (!result.ok) {
    logger.error('tag_metadata.fetch_failed', { slug, error: result.error });
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
    href: routes.tag(slug, pageNumber),
    translations:
      pageNumber === undefined
        ? translations.map(({ language, slug: translatedSlug }) => ({
            language,
            href: routes.tag(translatedSlug),
          }))
        : [],
    ogType: 'website',
    feedUrl: routes.tagRssFeed(slug),
  });
};
