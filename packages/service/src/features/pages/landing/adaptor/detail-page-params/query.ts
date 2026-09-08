import { q } from '@blog/service/sanity/query';

export const landingPageParamsQuery = q.star
  .filterByType('page_landing')
  .project((sub) => ({
    slug: sub.field('slug.current').notNull(),
  }));
