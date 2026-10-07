import { q } from '@blog/service/sanity/query/query';
import { postFeedFragment } from '@blog/service/shared/fragments/post/post-feed';
import type { TLocaleQueryParams } from '@blog/service/shared/localization/locale-query-params/locale-query-params';
import { publishedPostsInLocale } from '@blog/service/shared/localization/published-posts-in-locale/published-posts-in-locale';

export const allPublishedPostsQuery = publishedPostsInLocale(
  q.parameters<TLocaleQueryParams>().star,
)
  .order('publishedAt desc')
  .project(postFeedFragment);
