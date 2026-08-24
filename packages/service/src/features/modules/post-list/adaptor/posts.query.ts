import { q } from '@blog/service/sanity/query';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/filters/published-post';
import { postCardFragment } from '@blog/service/shared/fragments/post';

/**
 * Scopes posts to the enclosing `page_tag`'s tag when one references this
 * module as its `postList` (a no-op otherwise, e.g. the blog index's own
 * `postList`). Can't reach the parent via GROQ's `^` here — unlike
 * `tagPaginationParamsQuery`, this query isn't nested inside a `page_tag`
 * projection — so it looks the `page_tag` up by this module's `$id`
 * instead, then matches by reference identity (not slug), same drift-safety
 * reasoning as `tagPaginationParamsQuery`.
 */
const TAG_SCOPE_FILTER =
  '(!defined(*[_type == "page_tag" && postList._ref == $id][0]._id) || references(*[_type == "page_tag" && postList._ref == $id][0].tag._ref))';

const posts = q.star
  .filterByType('blog_post')
  .filterRaw(PUBLISHED_POST_FILTER)
  .filterRaw(TAG_SCOPE_FILTER);

/**
 * Windowed posts for the post-list archive, alongside the total match count
 * so the caller can compute total pages. Built per-request so `pageSize`
 * bounds the results in GROQ (end-exclusive `.slice(start, end)`) rather
 * than fetching the whole `blog_post` collection to slice in JS. The
 * `module_postList` document's own id binds `TAG_SCOPE_FILTER`'s `$id` via
 * the caller's `runQuery(query, { parameters: { id } })`.
 */
export function postListModulePaginatedPostsQuery(
  page: number,
  pageSize: number,
) {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return q
    .parameters<{ id: string }>()
    .project((sub) => ({
      posts: posts
        .order('publishedAt desc')
        .slice(start, end)
        .project(postCardFragment)
        .notNull(true),
      total: sub.count(posts).notNull(true),
    }))
    .notNull(true);
}
