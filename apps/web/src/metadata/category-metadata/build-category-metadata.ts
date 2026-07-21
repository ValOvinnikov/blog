import { routes } from '@blog/config';
import { service } from '@blog/service';
import { toMetadata } from '@web/metadata/to-metadata';
import type { Metadata } from 'next';

/**
 * Metadata for a `/category/[slug]` page. `TCategory` carries no dedicated
 * `seo`/OG fields (unlike `TPostDetail.seo`), so this builds `Metadata`
 * directly from the category's own `title`/`description` rather than
 * inventing fields the service layer doesn't provide.
 *
 * Reuses `getCategoryPage` (also called by `CategoryPage`) — Next dedupes
 * the fetch per request, so this adds no extra round-trip.
 */
export async function buildCategoryMetadata(slug: string): Promise<Metadata> {
  const page = await service.pages.category.v1.getCategoryPage(slug);

  if (!page) {
    return {};
  }

  const { category } = page;
  const description = category.description ?? category.title;

  return toMetadata(
    {
      title: category.title,
      description,
      ogTitle: category.title,
      ogDescription: description,
      ogImageUrl: undefined,
    },
    { canonical: routes.category(slug), ogType: 'website' },
  );
}
