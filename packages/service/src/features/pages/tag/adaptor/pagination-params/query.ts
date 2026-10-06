import { q } from '@blog/service/sanity/query/query';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/expressions/post/published-post';
import type { TPageQueryPageParams } from '@blog/service/shared/types/page/page-query-page-params';

export const tagPaginationParamsQuery = q
  .parameters<TPageQueryPageParams>()
  .star.filterByType('page_tag')
  // groqd's typed filterBy has no `in` operator
  .filterRaw('language in $locales')
  .project((sub) => ({
    slug: sub.field('slug.current').notNull(),
    language: sub.field('language').notNull(),
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
