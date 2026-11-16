import { q } from '@shinefold/service/sanity/query/query';
import type { TPageQueryPageParams } from '@shinefold/service/shared/types/page/page-query-page-params';

export const topicParamsQuery = q
  .parameters<TPageQueryPageParams>()
  .star.filterByType('page_topic')
  // groqd's typed filterBy has no `in` operator
  .filterRaw('language in $locales')
  .project((sub) => ({
    slug: sub.field('slug.current').notNull(),
    language: sub.field('language').notNull(),
  }));
