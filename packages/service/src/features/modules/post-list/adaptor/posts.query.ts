import { q } from '@blog/service/sanity/query';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/filters/published-post';
import { postCardFragment } from '@blog/service/shared/fragments/post';

/**
 * Correlates posts back to the enclosing `page_tag`, given only the
 * `module_postList` document's own `$id` (unlike `tagPaginationParamsQuery`,
 * this query isn't nested inside a `page_tag` projection, so it can't reach
 * the parent via `^`). Looks up the `page_tag` (if any) whose `postList`
 * references this module: when none exists (the blog index's own
 * `postList`, or any other non-tag usage), the clause is a no-op and posts
 * stay unscoped; when one does, posts are scoped to that `page_tag`'s
 * `tag._ref`, matched by reference identity in `tags[]` — not slug, for the
 * same drift-safety reason as `tagPaginationParamsQuery`.
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
 * than fetching the whole `blog_post` collection to slice in JS. `id` is the
 * `module_postList` document's own id, bound to `TAG_SCOPE_FILTER`'s `$id`
 * via the caller's `runQuery({ parameters: { id } })`.
 */
export function postListModulePaginatedPostsQuery(
  id: string,
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
