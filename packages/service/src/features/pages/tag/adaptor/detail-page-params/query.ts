import { q } from '@blog/service/sanity/query';

export const tagParamsQuery = q.star
  .filterByType('page_tag')
  .project((sub) => ({
    slug: sub.field('slug.current').notNull(),
  }));
