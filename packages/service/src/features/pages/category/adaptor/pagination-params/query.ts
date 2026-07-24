import { q } from '@blog/service/sanity/query';

// `perspective: 'published'` (sanity/client.ts) already excludes drafts, so a
// plain reference count is the published-post count — no extra status filter
// needed. `^._id` (GROQ's parent-scope operator) correlates each `blog_post`
// back to the enclosing category document within this per-item projection —
// one round-trip for every category's slug + post count, no per-slug fan-out
// (mirrors packages/service/src/features/entities/categories/adaptor/query.ts, #751).
export const categoryPaginationParamsQuery = q.star
  .filterByType('blog_category')
  .project((sub) => ({
    slug: sub.field('slug.current').notNull(),
    postCount: sub
      .count(sub.star.filterByType('blog_post').filterRaw('references(^._id)'))
      .notNull(true),
  }));
