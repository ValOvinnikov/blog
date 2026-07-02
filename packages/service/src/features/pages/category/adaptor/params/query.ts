import { q } from '#/sanity/query';

export const categoryParamsQuery = q.star
  .filterByType('category')
  .project((sub) => ({
    slug: sub.field('slug.current').notNull(),
  }));
