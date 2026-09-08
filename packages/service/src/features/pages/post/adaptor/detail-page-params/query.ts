import { q } from '@blog/service/sanity/query';
import {
  POST_CONTENT_READY_FILTER,
  PUBLISHED_POST_FILTER,
} from '@blog/service/shared/filters/published-post';

// `POST_CONTENT_READY_FILTER` excludes a post whose content fields aren't
// populated yet, so the sitemap never advertises a route that isn't
// actually renderable.
export const postParamsQuery = q.star
  .filterByType('page_post')
  .filterRaw(PUBLISHED_POST_FILTER)
  .filterRaw(POST_CONTENT_READY_FILTER)
  .project((sub) => ({
    slug: sub.field('slug.current').notNull(),
    publishedAt: sub.field('publishedAt').notNull(),
  }));
