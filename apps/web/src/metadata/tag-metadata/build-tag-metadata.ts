import { routes } from '@blog/config';
import { service } from '@blog/service';
import { toMetadata } from '@web/metadata/to-metadata';
import { TAG_ITEMS_PER_PAGE } from '@web/utils/tag-items-per-page';
import type { Metadata } from 'next';

/**
 * Metadata for a `/tag/[slug]` page (page 1, `pageNumber` omitted) or a
 * `/tag/[slug]/page/[page]` page (`pageNumber` ≥ 2). Unlike `TCategory`,
 * `TTagPageTag.seo` is already a fully-resolved `TSeoResolved` (authored →
 * content → site defaults), so this maps it straight through `toMetadata`,
 * only overlaying the "– Page N" suffix on `title`/`ogTitle` for page ≥ 2 —
 * matching `buildCategoryMetadata`'s pagination behaviour. Every page
 * self-canonicalizes — page 2+ must never canonical to `/tag/[slug]`.
 *
 * Reuses `getTagPage` (also called by `TagPage`) — Next dedupes the fetch
 * per request, so this adds no extra round-trip.
 */
export async function buildTagMetadata(
  slug: string,
  pageNumber?: number,
): Promise<Metadata> {
  const result = await service.pages.tag.v1.getTagPage(slug, {
    page: pageNumber,
    itemsPerPage: TAG_ITEMS_PER_PAGE,
  });

  if (!result.ok) {
    console.error(`Error to fetch tag page metadata: ${result.error}`);
    return {};
  }
  if (result.data === null) {
    return {};
  }

  const { seo } = result.data.tag;
  // "– Page N" stays a hardcoded suffix until translation messages land
  // (#321), matching `buildCategoryMetadata`.
  const title =
    pageNumber === undefined ? seo.title : `${seo.title} – Page ${pageNumber}`;
  const ogTitle =
    pageNumber === undefined
      ? seo.ogTitle
      : `${seo.ogTitle} – Page ${pageNumber}`;

  return toMetadata(
    { ...seo, title, ogTitle },
    {
      canonical: routes.tag(slug, pageNumber),
      ogType: 'website',
    },
  );
}
