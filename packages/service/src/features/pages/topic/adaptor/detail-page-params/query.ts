import { q } from '@blog/service/sanity/query';

export const topicParamsQuery = q.star
  .filterByType('blog_topic')
  .project((sub) => ({
    slug: sub.field('slug.current').notNull(),
  }));
