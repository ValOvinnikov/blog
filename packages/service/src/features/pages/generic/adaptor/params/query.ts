import { q } from '@blog/service/sanity/query';

export const genericPageParamsQuery = q.star
  .filterByType('page_generic')
  .project((sub) => ({
    slug: sub.field('slug.current').notNull(),
  }));
