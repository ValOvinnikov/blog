import { q } from '#/sanity/query';

export const postParamsQuery = q.star
  .filterByType('blog_post')
  .project((sub) => ({
    slug: sub.field('slug.current').notNull(),
  }));
