import { q } from '@blog/service/sanity/query/query';
import { postCardFragment } from '@blog/service/shared/fragments/post/post';
import type { TLocaleQueryParams } from '@blog/service/shared/localization/locale-query-params/locale-query-params';
import { publishedPostsInLocale } from '@blog/service/shared/localization/published-posts-in-locale/published-posts-in-locale';

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

  const published = publishedPostsInLocale(
    q.parameters<TLocaleQueryParams & TPostListScope>().star,
  );
  const posts = scope ? published.filterBy('references($termId)') : published;

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
