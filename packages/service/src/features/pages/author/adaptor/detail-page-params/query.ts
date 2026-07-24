import { q } from '@blog/service/sanity/query';

export const authorParamsQuery = q.star
  .filterByType('blog_author')
  .project((sub) => ({
    slug: sub.field('slug.current').notNull(),
  }));
