import { routes } from '@blog/config';
import { service } from '@blog/service';
import { routing } from '@web/i18n/routing';
import { AUTHOR_ITEMS_PER_PAGE } from '@web/utils/author-items-per-page';
import { CATEGORY_ITEMS_PER_PAGE } from '@web/utils/category-items-per-page';
import { env } from '@web/utils/env/env';
import { TAG_ITEMS_PER_PAGE } from '@web/utils/tag-items-per-page';
import type { MetadataRoute } from 'next';

// `getPostParams()` now projects `{ slug, publishedAt }`, so post entries set
// `lastModified` below. `getCategoryParams()`/`getTagParams()`/
// `getAuthorParams()`/`getPageSlugs()` (and the pagination variants) still
// project only `{ slug }` (or `{ slug, page }`) — no query in web's reach
// exposes a `publishedAt`/`_updatedAt` field for those yet, so `lastModified`
// stays unset for them until a service-layer change adds one.
function toEntry(
  path: string,
  siteUrl: string,
  lastModified?: Date | string,
): MetadataRoute.Sitemap[number] {
  return {
    url: `${siteUrl}${path}`,
    ...(lastModified ? { lastModified } : {}),
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((locale) => [
          locale.toLowerCase(),
          `${siteUrl}${path}`,
        ]),
      ),
    },
  };
}

async function getPostParamsSafe() {
  try {
    return await service.pages.post.v1.getPostParams();
  } catch (error) {
    console.error(`Error fetching post params for sitemap: ${error}`);
    return [];
  }
}

async function getCategoryParamsSafe() {
  try {
    return await service.pages.category.v1.getCategoryParams();
  } catch (error) {
    console.error(`Error fetching category params for sitemap: ${error}`);
    return [];
  }
}

async function getTagParamsSafe() {
  try {
    return await service.pages.tag.v1.getTagParams();
  } catch (error) {
    console.error(`Error fetching tag params for sitemap: ${error}`);
    return [];
  }
}

async function getAuthorParamsSafe() {
  try {
    return await service.entities.author.v1.getAuthorParams();
  } catch (error) {
    console.error(`Error fetching author params for sitemap: ${error}`);
    return [];
  }
}

// Pages 2..N of a category/tag archive are near-duplicate slices of the same
// post list (same title/description pattern, decreasing content density) —
// included anyway, for consistency with the numbered `/blog/page/N` entries
// already listed below, rather than treating paginated archives as
// crawlable-but-not-advertised. `itemsPerPage` must match the value each
// numbered-page route's own `generateStaticParams` uses, or the two disagree
// on how many pages exist.
async function getCategoryPaginationParamsSafe() {
  try {
    return await service.pages.category.v1.getCategoryPaginationParams(
      CATEGORY_ITEMS_PER_PAGE,
    );
  } catch (error) {
    console.error(
      `Error fetching category pagination params for sitemap: ${error}`,
    );
    return [];
  }
}

async function getTagPaginationParamsSafe() {
  try {
    return await service.pages.tag.v1.getTagPaginationParams(
      TAG_ITEMS_PER_PAGE,
    );
  } catch (error) {
    console.error(`Error fetching tag pagination params for sitemap: ${error}`);
    return [];
  }
}

async function getAuthorPaginationParamsSafe() {
  try {
    return await service.entities.author.v1.getAuthorPaginationParams(
      AUTHOR_ITEMS_PER_PAGE,
    );
  } catch (error) {
    console.error(
      `Error fetching author pagination params for sitemap: ${error}`,
    );
    return [];
  }
}

/**
 * Site-wide sitemap: home, blog index + every numbered page, the `/topics`
 * hub, every published post, category, tag, and author archive (plus their
 * numbered pages 2..N for category/tag/author — see the pagination helpers
 * above), and every generic page. Every entry carries a `languages` alternate for
 * each configured locale — a no-op today
 * (`localePrefix: 'never'` means every locale resolves to the same
 * unprefixed path) but keeps this future-proof if locale-prefixed routing is
 * ever introduced.
 *
 * Returns an empty sitemap (logged) when `NEXT_PUBLIC_SITE_URL` is unset —
 * every URL in a sitemap must be absolute, so there is no meaningful
 * relative fallback (mirrors `buildBlogPostingSchema`'s same judgment call).
 *
 * `lastModified` (#780): post entries set it from `getPostParams()`'s
 * `publishedAt` field. Category/tag/author/generic-page params queries still
 * project only slug/page — none carries a `publishedAt`/`_updatedAt` field
 * yet, so those entries leave `lastModified` unset until a service-layer
 * change adds one; `toEntry()` already accepts an optional `lastModified`
 * param so wiring it in later is a one-line change per entry.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    console.error('Cannot build sitemap: NEXT_PUBLIC_SITE_URL is not set.');
    return [];
  }

  const [
    posts,
    categories,
    tags,
    authors,
    categoryPages,
    tagPages,
    authorPages,
    blogParamsResult,
    genericPageSlugsResult,
  ] = await Promise.all([
    getPostParamsSafe(),
    getCategoryParamsSafe(),
    getTagParamsSafe(),
    getAuthorParamsSafe(),
    getCategoryPaginationParamsSafe(),
    getTagPaginationParamsSafe(),
    getAuthorPaginationParamsSafe(),
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
    toEntry(routes.topics(), siteUrl),
    ...blogPageNumbers.map((page) => toEntry(routes.blogIndex(page), siteUrl)),
    ...posts.map(({ slug, publishedAt }) =>
      toEntry(routes.post(slug), siteUrl, publishedAt),
    ),
    ...categories.map(({ slug }) => toEntry(routes.category(slug), siteUrl)),
    ...categoryPages.map(({ slug, page }) =>
      toEntry(routes.category(slug, Number(page)), siteUrl),
    ),
    ...tags.map(({ slug }) => toEntry(routes.tag(slug), siteUrl)),
    ...tagPages.map(({ slug, page }) =>
      toEntry(routes.tag(slug, Number(page)), siteUrl),
    ),
    ...authors.map(({ slug }) => toEntry(routes.author(slug), siteUrl)),
    ...authorPages.map(({ slug, page }) =>
      toEntry(routes.author(slug, Number(page)), siteUrl),
    ),
    ...genericPageSlugs.map(({ slug }) =>
      toEntry(routes.genericPage(slug), siteUrl),
    ),
  ];
}
