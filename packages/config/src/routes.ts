/**
 * Single source of truth for app URL construction. Consumed by `service`
 * (href-emitting transformers) and `web` (routes, pagination `createHref`,
 * sitemap, JSON-LD) — never build these paths inline elsewhere.
 * Spec: docs/superpowers/specs/2026-07-14-blog-list-pagination-design.md.
 */
export const routes = {
  home: () => '/',
  /** Page 1 lives at /blog only; pages ≥ 2 under the static `page/` segment. */
  blogIndex: (page = 1) => (page === 1 ? '/blog' : `/blog/page/${page}`),
  post: (slug: string) => `/blog/${slug}`,
  /** Page 1 lives at /category/{slug} only; pages ≥ 2 under the static `page/` segment. */
  category: (slug: string, page = 1) =>
    page === 1 ? `/category/${slug}` : `/category/${slug}/page/${page}`,
  /** Page 1 lives at /tag/{slug} only; pages ≥ 2 under the static `page/` segment. */
  tag: (slug: string, page = 1) =>
    page === 1 ? `/tag/${slug}` : `/tag/${slug}/page/${page}`,
  author: (slug: string) => `/author/${slug}`,
  genericPage: (slug: string) => `/${slug}`,
} as const;
