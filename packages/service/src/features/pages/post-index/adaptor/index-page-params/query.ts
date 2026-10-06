import { q } from '@blog/service/sanity/query/query';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/expressions/post/published-post';

export const indexPageParamsQuery = q.star
  .filterByType('page_postIndex')
  .slice(0)
  .project((page) => ({
    blogPosts: q.project((sub) => ({
      total: sub
        .count(
          q.star.filterByType('page_post').filterRaw(PUBLISHED_POST_FILTER),
        )
        .notNull(true),
    })),
    moduleRefs: page
      .field('template')
      .deref()
      .field('modules[]')
      .project(() => ({ _ref: true }))
      .nullable(true),
  }))
  .notNull();
