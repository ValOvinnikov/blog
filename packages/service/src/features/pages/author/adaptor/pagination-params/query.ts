import { q } from '@blog/service/sanity/query';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/filters/published-post';

// `^._id` (GROQ's parent-scope operator) correlates each `blog_post` back to
// the enclosing author document within this per-item projection — one
// round-trip for every author's slug + post count, no per-slug fan-out
// (mirrors packages/service/src/features/entities/topics/adaptor/query.ts).
export const authorPaginationParamsQuery = q.star
  .filterByType('blog_author')
  .project((sub) => ({
    slug: sub.field('slug.current').notNull(),
    postCount: sub
      .count(
        sub.star
          .filterByType('blog_post')
          .filterRaw('references(^._id)')
          .filterRaw(PUBLISHED_POST_FILTER),
      )
      .notNull(true),
  }));
