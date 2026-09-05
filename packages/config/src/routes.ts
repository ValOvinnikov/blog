/**
 * Single source of truth for app URL construction. Consumed by `service`
 * (href-emitting transformers) and `web` (routes, pagination `createHref`,
 * sitemap, JSON-LD) — never build these paths inline elsewhere.
 */
export const routes = {
  home: () => '/',
  /** Page 1 lives at /blog only; pages ≥ 2 under the static `page/` segment. */
  blogIndex: (page = 1) => (page === 1 ? '/blog' : `/blog/page/${page}`),
  post: (slug: string) => `/blog/${slug}`,
  /** Page 1 lives at /topics/{slug} only; pages ≥ 2 under the static `page/` segment. */
  topic: (slug: string, page = 1) =>
    page === 1 ? `/topics/${slug}` : `/topics/${slug}/page/${page}`,
  /** Page 1 lives at /tags/{slug} only; pages ≥ 2 under the static `page/` segment. */
  tag: (slug: string, page = 1) =>
    page === 1 ? `/tags/${slug}` : `/tags/${slug}/page/${page}`,
  topics: () => '/topics',
  tags: () => '/tags',
  /** Auth-gated "My bookmarks" listing — no slug/pagination, one static path per reader. */
  bookmarks: () => '/bookmarks',
  /** Auth-gated account hub — one static path per reader; additional `WindowChrome` sections mount here without a new route. */
  account: () => '/account',
  /** The `/account` "export my data" download — a Route Handler, not a page, so it's outside `[locale]` like `rssFeed` below. */
  accountExport: () => '/api/account/export',
  /** The double-opt-in confirmation link — a Route Handler, not a page, so it's outside `[locale]` like `accountExport` above. */
  newsletterConfirm: (token: string) =>
    `/api/newsletter/confirm?token=${encodeURIComponent(token)}`,
  /** The no-session unsubscribe link — a Route Handler, not a page, so it's outside `[locale]` like `accountExport` above. */
  newsletterUnsubscribe: (token: string) =>
    `/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`,
  genericPage: (slug: string) => `/${slug}`,
  rssFeed: () => '/rss.xml',
  /** No pagination variant — always the tag's base path + `/rss.xml`. */
  tagRssFeed: (slug: string) => `${routes.tag(slug)}/rss.xml`,
} as const;
