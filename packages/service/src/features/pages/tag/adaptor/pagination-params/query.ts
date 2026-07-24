import { q } from '@blog/service/sanity/query';

// `references()` matches a tag reference anywhere in the document, including
// inside the `tags[]` array, so this correlates each tag's own post count via
// GROQ's `^._id` parent-scope operator — one round-trip for every tag's slug
// + post count, no per-slug fan-out (mirrors
// packages/service/src/features/entities/categories/adaptor/query.ts, #751).
export const tagPaginationParamsQuery = q.star
  .filterByType('blog_tag')
  .project((sub) => ({
    slug: sub.field('slug.current').notNull(),
    postCount: sub
      .count(sub.star.filterByType('blog_post').filterRaw('references(^._id)'))
      .notNull(true),
  }));
