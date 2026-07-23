import { routes } from '@blog/config';
import { service } from '@blog/service';
import { toMetadata } from '@web/metadata/to-metadata';
import { AUTHOR_ITEMS_PER_PAGE } from '@web/utils/author-items-per-page';
import { blockTextToPlain } from '@web/utils/block-text-to-plain';
import type { Metadata } from 'next';

/**
 * Metadata for an `/author/[slug]` page (page 1, `pageNumber` omitted) or an
 * `/author/[slug]/page/[page]` page (`pageNumber` ≥ 2). `TAuthorDetail`
 * carries no dedicated `seo`/OG fields (same situation as `TCategory`), so
 * this builds `Metadata` directly from the author's own `name`/`role`/`bio`
 * rather than inventing fields the service layer doesn't provide. Every page
 * self-canonicalizes — page 2+ must never canonical to `/author/[slug]`.
 *
 * Reuses `getAuthorPage` (also called by `AuthorPage`) — Next dedupes the
 * fetch per request, so this adds no extra round-trip.
 */
export async function buildAuthorMetadata(
  slug: string,
  pageNumber?: number,
): Promise<Metadata> {
  const result = await service.entities.author.v1.getAuthorPage(slug, {
    page: pageNumber,
    itemsPerPage: AUTHOR_ITEMS_PER_PAGE,
  });

  if (!result) {
    return {};
  }

  const { author } = result;
  const baseTitle = author.role
    ? `${author.name} — ${author.role}`
    : author.name;
  const description = blockTextToPlain(author.bio) ?? baseTitle;
  // "– Page N" stays a hardcoded suffix until translation messages land
  // (#321), matching `buildCategoryMetadata`.
  const title =
    pageNumber === undefined ? baseTitle : `${baseTitle} – Page ${pageNumber}`;

  return toMetadata(
    {
      title,
      description,
      ogTitle: title,
      ogDescription: description,
      ogImageUrl: author.imageUrl,
    },
    {
      canonical: routes.author(slug, pageNumber),
      ogType: 'website',
    },
  );
}
