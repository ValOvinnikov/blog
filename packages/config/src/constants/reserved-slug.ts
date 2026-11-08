/** Top-level path segments owned by static routes, which a landing page slug would otherwise be shadowed by. */
export const RESERVED_SLUGS = [
  'blog',
  'category',
  'tag',
  'author',
  'api',
  'page',
  'topics',
  'tags',
  'privacy',
  'legal',
] as const;

export type TReservedSlug = (typeof RESERVED_SLUGS)[number];
