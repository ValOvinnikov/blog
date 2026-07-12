import { q } from '#/sanity/query';
import { postCardFragment } from '#/shared/fragments/post';

/**
 * Newest posts for a post-list module. Built per-request so the `limit` (from
 * the module document, schema-capped at 12) is applied in GROQ — Sanity returns
 * at most `limit` documents instead of the whole `blog_post` collection.
 * `.slice(0, limit)` is end-exclusive, so it yields indices `0..limit-1`.
 */
export const postListModulePostsQuery = (limit: number) =>
  q.star
    .filterByType('blog_post')
    .order('publishedAt desc')
    .slice(0, limit)
    .project(postCardFragment);
