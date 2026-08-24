import { q } from '@blog/service/sanity/query';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/filters/published-post';
import { feedPostFragment } from '@blog/service/shared/fragments/feed-post';

/**
 * Every published post, newest first, for the RSS/Atom feeds — no
 * pagination, since a feed reads the whole set in one query rather than
 * walking the paginated archive windows.
 */
export const allPublishedPostsQuery = q.star
  .filterByType('blog_post')
  .filterRaw(PUBLISHED_POST_FILTER)
  .order('publishedAt desc')
  .project(feedPostFragment);
