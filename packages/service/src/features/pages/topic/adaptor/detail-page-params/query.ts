import { q } from '@blog/service/sanity/query';

export const topicParamsQuery = q.star
  .filterByType('page_topic')
  .project((sub) => ({
    slug: sub.field('slug.current').notNull(),
  }));
