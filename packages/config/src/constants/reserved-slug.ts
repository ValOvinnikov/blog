/**
 * Path segments claimed by static routes in `apps/web`, listed below every
 * static route in Next.js route priority (static > dynamic > catch-all).
 * A generic content page (routed by the planned `/[slug]` catch-all, see #285)
 * slugged with one of these values would be silently unreachable, so both
 * `apps/cms` (slug validation) and `apps/web` (route-subset coverage) consume
 * this as the single source of truth.
 */
export const RESERVED_SLUGS = [
  'blog',
  'category',
  'author',
  'api',
  'page',
] as const;

export type TReservedSlug = (typeof RESERVED_SLUGS)[number];
