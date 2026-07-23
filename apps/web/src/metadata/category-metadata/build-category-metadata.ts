import { routes } from '@blog/config';
import { service } from '@blog/service';
import { toMetadata } from '@web/metadata/to-metadata';
import { CATEGORY_ITEMS_PER_PAGE } from '@web/utils/category-items-per-page';
import type { Metadata } from 'next';

/**
 * Metadata for a `/category/[slug]` page (page 1, `pageNumber` omitted) or a
 * `/category/[slug]/page/[page]` page (`pageNumber` ≥ 2). `TCategory` carries
 * no dedicated `seo`/OG fields (unlike `TPostDetail.seo`), so this builds
 * `Metadata` directly from the category's own `title`/`description` rather
 * than inventing fields the service layer doesn't provide. Every page
 * self-canonicalizes — page 2+ must never canonical to `/category/[slug]`.
 *
 * Reuses `getCategoryPage` (also called by `CategoryPage`) — Next dedupes
 * the fetch per request, so this adds no extra round-trip.
 */
export async function buildCategoryMetadata(
  slug: string,
  pageNumber?: number,
): Promise<Metadata> {
  const result = await service.pages.category.v1.getCategoryPage(slug, {
    page: pageNumber,
    itemsPerPage: CATEGORY_ITEMS_PER_PAGE,
  });

  if (!result.ok) {
    console.error(`Error to fetch category page metadata: ${result.error}`);
    return {};
  }
  if (result.data === null) {
    return {};
  }

  const { category } = result.data;
  const description = category.description ?? category.title;
  // "– Page N" stays a hardcoded suffix until translation messages land
  // (#321), matching `buildBlogListMetadata`.
  const title =
    pageNumber === undefined
      ? category.title
      : `${category.title} – Page ${pageNumber}`;

  return toMetadata(
    {
      title,
      description,
      ogTitle: title,
      ogDescription: description,
      ogImageUrl: undefined,
    },
    {
      canonical: routes.category(slug, pageNumber),
      ogType: 'website',
    },
  );
}
