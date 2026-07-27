import { q } from '@blog/service/sanity/query';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/filters/published-post';

export const postParamsQuery = q.star
  .filterByType('blog_post')
  .filterRaw(PUBLISHED_POST_FILTER)
  .project((sub) => ({
    slug: sub.field('slug.current').notNull(),
    publishedAt: sub.field('publishedAt').notNull(),
  }));
