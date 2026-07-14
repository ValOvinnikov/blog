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
  category: (slug: string) => `/category/${slug}`,
  author: (slug: string) => `/author/${slug}`,
  genericPage: (slug: string) => `/${slug}`,
} as const;
