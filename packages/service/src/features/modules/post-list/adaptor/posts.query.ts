import { q } from '@blog/service/sanity/query/query';
import { postCardFragment } from '@blog/service/shared/fragments/post/post';
import type { TLocaleParams } from '@blog/service/shared/localization/locale-params/locale-params';
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
    q.parameters<TLocaleParams & TPostListScope>().star,
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
