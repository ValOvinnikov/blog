import { routes } from '@blog/config';
import { service } from '@blog/service';
import { toMetadata } from '@web/metadata/to-metadata';
import type { Metadata } from 'next';

/**
 * Metadata for a blog list page. Every page self-canonicalizes — page 2+
 * must NEVER canonical to /blog (spec do-not-change rule).
 *
 * Reuses `getIndexPage` (also called by `BlogListPage`) — Next dedupes the
 * fetch per request, so this adds no extra round-trip.
 */
export async function buildBlogListMetadata(page: number): Promise<Metadata> {
  const result = await service.pages.blog.v1.getIndexPage({ page });

  if (!result.ok) {
    console.error(`Error to fetch blog index page metadata: ${result.error}`);
    return {};
  }

  const { seo } = result.data;
  // "– Page N" stays a hardcoded suffix until translation messages land (#321).
  const resolvedSeo =
    page === 1
      ? seo
      : {
          ...seo,
          title: `${seo.title} – Page ${page}`,
          ogTitle: `${seo.ogTitle} – Page ${page}`,
        };

  return toMetadata(resolvedSeo, {
    canonical: routes.blogIndex(page),
    ogType: 'website',
  });
}
