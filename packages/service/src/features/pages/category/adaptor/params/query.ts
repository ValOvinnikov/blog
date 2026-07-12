import { q } from '#/sanity/query';

export const categoryParamsQuery = q.star
  .filterByType('blog_category')
  .project((sub) => ({
    slug: sub.field('slug.current').notNull(),
  }));
