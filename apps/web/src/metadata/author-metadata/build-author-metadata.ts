import { routes } from '@blog/config';
import { service } from '@blog/service';
import { toMetadata } from '@web/metadata/to-metadata';
import { AUTHOR_ITEMS_PER_PAGE } from '@web/utils/author-items-per-page';
import { blockTextToPlain } from '@web/utils/block-text-to-plain';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

/**
 * Metadata for an `/author/[slug]` page (page 1, `pageNumber` omitted) or an
 * `/author/[slug]/page/[page]` page (`pageNumber` ≥ 2). `TAuthorDetail`
 * carries no dedicated `seo`/OG fields (same situation as `TTopic`), so
 * this builds `Metadata` directly from the author's own `name`/`role`/`bio`
 * rather than inventing fields the service layer doesn't provide. Every page
 * self-canonicalizes — page 2+ must never canonical to `/author/[slug]`.
 *
 * Reuses `getAuthorPage` (also called by `AuthorPage`) — Next dedupes the
 * fetch per request, so this adds no extra round-trip.
 */
export const buildAuthorMetadata = async (
  slug: string,
  pageNumber?: number,
): Promise<Metadata> => {
  const [result, t, authorMetadataT] = await Promise.all([
    service.pages.author.v1.getAuthorPage(slug, {
      page: pageNumber,
      itemsPerPage: AUTHOR_ITEMS_PER_PAGE,
    }),
    getTranslations('pagination'),
    getTranslations('authorMetadata'),
  ]);

  if (!result.ok) {
    logger.error('author_metadata.fetch_failed', {
      slug,
      error: result.error,
    });
    return {};
  }
  if (result.data === null) {
    return {};
  }

  const { author } = result.data;
  const baseTitle = author.role
    ? authorMetadataT('nameWithRole', {
        name: author.name,
        role: author.role,
      })
    : author.name;
  const description = blockTextToPlain(author.bio) ?? baseTitle;
  const title =
    pageNumber === undefined
      ? baseTitle
      : `${baseTitle} ${t('pageSuffix', { page: pageNumber })}`;

  return toMetadata(
    {
      title,
      description,
      ogTitle: title,
      ogDescription: description,
      ogImageUrl: author.ogImageUrl,
    },
    {
      canonical: routes.author(slug, pageNumber),
      ogType: 'website',
    },
  );
};
