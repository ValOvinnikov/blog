import { q } from '@blog/service/sanity/query';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/expressions/post/published-post';
import { postCardFragment } from '@blog/service/shared/fragments/post/post';

export type TPostListScope = {
  termId: string;
};

export function postListModulePaginatedPostsQuery(
  page: number,
  pageSize: number,
  scope?: TPostListScope,
) {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  const posts = scope
    ? q.star
        .filterByType('page_post')
        .filterRaw(PUBLISHED_POST_FILTER)
        .filterRaw('references($termId)')
    : q.star.filterByType('page_post').filterRaw(PUBLISHED_POST_FILTER);

  return q
    .parameters<{ termId?: string }>()
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
