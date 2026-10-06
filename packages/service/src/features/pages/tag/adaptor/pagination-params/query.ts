import { q } from '@blog/service/sanity/query/query';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/expressions/post/published-post';

export const tagPaginationParamsQuery = q.star
  .filterByType('page_tag')
  .project((sub) => ({
    slug: sub.field('slug.current').notNull(),
    moduleRefs: sub
      .field('template')
      .deref()
      .field('modules[]')
      .project(() => ({ _ref: true }))
      .nullable(true),
    postCount: sub
      .count(
        sub.star
          .filterByType('page_post')
          .filterRaw('references(^.tag._ref)')
          .filterRaw(PUBLISHED_POST_FILTER),
      )
      .notNull(true),
  }));
