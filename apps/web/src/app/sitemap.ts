import { routes } from '@blog/config';
import { service } from '@blog/service';
import { routing } from '@web/i18n/routing';
import { env } from '@web/utils/env/env';
import type { MetadataRoute } from 'next';

function toEntry(path: string, siteUrl: string): MetadataRoute.Sitemap[number] {
  return {
    url: `${siteUrl}${path}`,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((locale) => [locale, `${siteUrl}${path}`]),
      ),
    },
  };
}

/**
 * Site-wide sitemap: home, blog index + every numbered page, every published
 * post and category. Every entry carries a `languages` alternate for each
 * configured locale — a no-op today (`localePrefix: 'never'` means every
 * locale resolves to the same unprefixed path) but keeps this future-proof
 * if locale-prefixed routing is ever introduced.
 *
 * Returns an empty sitemap (logged) when `NEXT_PUBLIC_SITE_URL` is unset —
 * every URL in a sitemap must be absolute, so there is no meaningful
 * relative fallback (mirrors `buildBlogPostingSchema`'s same judgment call).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    console.error('Cannot build sitemap: NEXT_PUBLIC_SITE_URL is not set.');
    return [];
  }

  const [posts, categories, blogParamsResult, genericPageSlugsResult] =
    await Promise.all([
      service.pages.post.v1.getPostParams(),
      service.pages.category.v1.getCategoryParams(),
      service.pages.blog.v1.getIndexPageParams(),
      service.pages.generic.v1.getPageSlugs(),
    ]);

  if (!blogParamsResult.ok) {
    console.error(
      `Error fetching blog page params for sitemap: ${blogParamsResult.error}`,
    );
  }
  const blogPageNumbers = blogParamsResult.ok
    ? blogParamsResult.data.map(({ page }) => Number(page))
    : [];

  if (!genericPageSlugsResult.ok) {
    console.error(
      `Error fetching generic page slugs for sitemap: ${genericPageSlugsResult.error}`,
    );
  }
  const genericPageSlugs = genericPageSlugsResult.ok
    ? genericPageSlugsResult.data
    : [];

  return [
    toEntry(routes.home(), siteUrl),
    toEntry(routes.blogIndex(), siteUrl),
    ...blogPageNumbers.map((page) => toEntry(routes.blogIndex(page), siteUrl)),
    ...posts.map(({ slug }) => toEntry(routes.post(slug), siteUrl)),
    ...categories.map(({ slug }) => toEntry(routes.category(slug), siteUrl)),
    ...genericPageSlugs.map(({ slug }) =>
      toEntry(routes.genericPage(slug), siteUrl),
    ),
  ];
}
