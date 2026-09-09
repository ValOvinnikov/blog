import { q } from '@blog/service/sanity/query';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/filters/published-post';
import { postCardFragment } from '@blog/service/shared/fragments/post';

/**
 * Scopes posts to the enclosing `page_tag`/`page_topic`'s own tag/topic when
 * one references this module as its `postList` (a no-op otherwise) — looked
 * up by this module's `$id` since there's no parent context to reach via
 * GROQ's `^`. The `&&` (not `||`) means a `postList` referenced by both a
 * `page_tag` and a `page_topic` at once must satisfy both scopes rather than
 * throw.
 */
const SCOPE_FILTER =
  '(!defined(*[_type == "page_tag" && postList._ref == $id][0]._id) || references(*[_type == "page_tag" && postList._ref == $id][0].tag._ref))' +
  ' && ' +
  '(!defined(*[_type == "page_topic" && postList._ref == $id][0]._id) || references(*[_type == "page_topic" && postList._ref == $id][0].topic._ref))';

const posts = q.star
  .filterByType('page_post')
  .filterRaw(PUBLISHED_POST_FILTER)
  .filterRaw(SCOPE_FILTER);

/**
 * Windowed posts for the post-list archive, alongside the total match count
 * so the caller can compute total pages. Built per-request so `pageSize`
 * bounds the results in GROQ (end-exclusive `.slice(start, end)`); `$id` in
 * `SCOPE_FILTER` is bound by the caller's `runQuery(query, { parameters: { id } })`.
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
