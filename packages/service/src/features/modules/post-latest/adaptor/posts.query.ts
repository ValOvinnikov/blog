import { q } from '@blog/service/sanity/query';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/filters/published-post';
import { postCardFragment } from '@blog/service/shared/fragments/post';

/**
 * Newest posts for a post-latest teaser module, unscoped (no topic/tag
 * filtering). Built per-request so `limit` bounds the results in GROQ
 * (end-exclusive `.slice(0, limit)`) rather than fetching the whole
 * `blog_post` collection to slice in JS.
 */
export const postLatestModulePostsQuery = (limit: number) =>
  q.star
    .filterByType('blog_post')
    .filterRaw(PUBLISHED_POST_FILTER)
    .order('publishedAt desc')
    .slice(0, limit)
    .project(postCardFragment);
