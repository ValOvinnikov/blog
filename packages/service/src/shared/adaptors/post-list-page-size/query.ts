import { q } from '@blog/service/sanity/query/query';

export const postListPageSizeQuery = q
  .parameters<{ ids: string[] }>()
  .star.filterByType('module_postList')
  .filterRaw('_id in $ids')
  .project((sub) => ({
    _id: true,
    pageSize: sub.field('pageSize').nullable(true),
  }));
