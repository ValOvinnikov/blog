import { MODULE_PAGE_CONTEXT, type TModulePageContext } from '@blog/config';
import { q } from '@blog/service/sanity/query';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/filters/published-post';
import { TAG_SCOPE_FILTER } from '@blog/service/shared/filters/tag-scope';
import { TOPIC_SCOPE_FILTER } from '@blog/service/shared/filters/topic-scope';
import { postCardFragment } from '@blog/service/shared/fragments/post';

type TPostListModuleParams = { slug?: string };

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
 * Built per-request so `limit` bounds the results in GROQ (end-exclusive
 * `.slice(0, limit)`) rather than fetching the whole `blog_post` collection
 * to slice in JS; omitting `context`, or passing HOME/BLOG/GENERIC, filters
 * nothing beyond publish status.
 */
export function postListModulePostsQuery(
  limit: number,
  context?: TModulePageContext,
) {
  return scopedPosts(context)
    .order('publishedAt desc')
    .slice(0, limit)
    .project(postCardFragment);
}

/**
 * Windowed posts for a paginated post-list placement, alongside the total
 * match count so the caller can compute total pages.
 */
export function postListModulePaginatedPostsQuery(
  context: TModulePageContext & { isPaginated: true },
) {
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
}
