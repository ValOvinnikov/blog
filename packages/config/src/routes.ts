/**
 * Single source of truth for app URL construction. Consumed by `service`
 * (href-emitting transformers) and `web` (routes, pagination `createHref`,
 * sitemap, JSON-LD) — never build these paths inline elsewhere.
 * Spec: docs/archive/superpowers/specs/2026-07-14-blog-list-pagination-design.md.
 */
export const routes = {
  home: () => '/',
  /** Page 1 lives at /blog only; pages ≥ 2 under the static `page/` segment. */
  blogIndex: (page = 1) => (page === 1 ? '/blog' : `/blog/page/${page}`),
  post: (slug: string) => `/blog/${slug}`,
  /** Page 1 lives at /topics/{slug} only; pages ≥ 2 under the static `page/` segment. */
  topic: (slug: string, page = 1) =>
    page === 1 ? `/topics/${slug}` : `/topics/${slug}/page/${page}`,
  /** Page 1 lives at /tag/{slug} only; pages ≥ 2 under the static `page/` segment. */
  tag: (slug: string, page = 1) =>
    page === 1 ? `/tag/${slug}` : `/tag/${slug}/page/${page}`,
  /** Page 1 lives at /author/{slug} only; pages ≥ 2 under the static `page/` segment. */
  author: (slug: string, page = 1) =>
    page === 1 ? `/author/${slug}` : `/author/${slug}/page/${page}`,
  topics: () => '/topics',
  /** Auth-gated "My bookmarks" listing (#1043/#1109) — no slug/pagination, one static path per reader. */
  bookmarks: () => '/bookmarks',
  /** Auth-gated account hub (#1151/#1154) — one static path per reader; grows more `WindowChrome` sections (6b/6c) without a new route. */
  account: () => '/account',
  /** The `/account` "export my data" download — a Route Handler, not a page, so it's outside `[locale]` like `rssFeed` below. */
  accountExport: () => '/api/account/export',
  genericPage: (slug: string) => `/${slug}`,
  rssFeed: () => '/rss.xml',
  /** No pagination variant — always the tag's base path + `/rss.xml`. */
  tagRssFeed: (slug: string) => `${routes.tag(slug)}/rss.xml`,
} as const;
