import { q } from '@blog/service/sanity/query/query';
import { postCardFragment } from '@blog/service/shared/fragments/post/post';
import type { TLocaleQueryParams } from '@blog/service/shared/localization/locale-query-params/locale-query-params';
import { publishedPostsInLocale } from '@blog/service/shared/localization/published-posts-in-locale/published-posts-in-locale';

export function postLatestModulePostsQuery(limit: number) {
  return publishedPostsInLocale(q.parameters<TLocaleQueryParams>().star)
    .order('publishedAt desc')
    .slice(0, limit)
    .project(postCardFragment);
}
