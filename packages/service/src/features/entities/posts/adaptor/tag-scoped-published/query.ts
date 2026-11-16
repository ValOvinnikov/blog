import { q } from '@shinefold/service/sanity/query/query';
import { postFeedFragment } from '@shinefold/service/shared/fragments/post/post-feed';
import type { TLocaleQueryParams } from '@shinefold/service/shared/localization/locale-query-params/locale-query-params';
import { publishedPostsInLocale } from '@shinefold/service/shared/localization/published-posts-in-locale/published-posts-in-locale';

export const tagScopedPublishedPostsQuery = publishedPostsInLocale(
  q.parameters<TLocaleQueryParams & { tagId: string }>().star,
)
  .filterBy('references($tagId)')
  .order('publishedAt desc')
  .project(postFeedFragment);
