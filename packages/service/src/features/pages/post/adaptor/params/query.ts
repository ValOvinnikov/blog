import { q } from '#/sanity/query';

export const postParamsQuery = q.star.filterByType('post').project((sub) => ({
  slug: sub.field('slug.current').notNull(),
}));
