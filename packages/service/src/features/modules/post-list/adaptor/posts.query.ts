import { MODULE_PAGE_CONTEXT, type TModulePageContext } from '@blog/config';
import { q } from '@blog/service/sanity/query';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/filters/published-post';
import { postCardFragment } from '@blog/service/shared/fragments/post';

type TPostListModuleParams = { slug?: string };

// Mirrors `topic/adaptor/detail-page/posts.query.ts` and
// `tag/adaptor/detail-page/posts.query.ts` — dereferenced paths aren't
// covered by groqd's `filterBy` typing, so both go through `filterRaw`.
const TOPIC_SCOPE_FILTER = 'topic->slug.current == $slug';
const TAG_SCOPE_FILTER = '$slug in tags[]->slug.current';

function scopedPosts(context?: TModulePageContext) {
  const base = q
    .parameters<TPostListModuleParams>()
    .star.filterByType('blog_post')
    .filterRaw(PUBLISHED_POST_FILTER);

  if (context?.type === MODULE_PAGE_CONTEXT.TOPIC) {
    return base.filterRaw(TOPIC_SCOPE_FILTER);
  }
  if (context?.type === MODULE_PAGE_CONTEXT.TAG) {
    return base.filterRaw(TAG_SCOPE_FILTER);
  }
  return base;
}

/**
 * Newest posts for a post-list module, optionally scoped by page context.
 * Built per-request so `limit` is applied in GROQ — Sanity returns at most
 * `limit` documents instead of the whole `blog_post` collection.
 * `.slice(0, limit)` is end-exclusive, so it yields indices `0..limit-1`.
 *
 * Omitting `context` (or passing a HOME/BLOG/GENERIC one) filters nothing
 * beyond publish status — same query as an unscoped module.
 */
export const postListModulePostsQuery = (
  limit: number,
  context?: TModulePageContext,
) =>
  scopedPosts(context)
    .order('publishedAt desc')
    .slice(0, limit)
    .project(postCardFragment);

/**
 * Windowed posts for a paginated post-list placement, alongside the total
 * match count so the caller can compute total pages.
 */
export const postListModulePaginatedPostsQuery = (
  context: TModulePageContext & { isPaginated: true },
) => {
  const start = (context.page - 1) * context.pageSize;
  const end = start + context.pageSize;
  const posts = scopedPosts(context);

  return q
    .parameters<TPostListModuleParams>()
    .project((sub) => ({
      posts: posts
        .order('publishedAt desc')
        .slice(start, end)
        .project(postCardFragment)
        .notNull(true),
      total: sub.count(posts).notNull(true),
    }))
    .notNull(true);
};
