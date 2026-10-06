import { q } from '@blog/service/sanity/query/query';
import { POST_IN_LOCALE_FILTER } from '@blog/service/shared/expressions/post/post-in-locale';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/expressions/post/published-post';
import { postFeedFragment } from '@blog/service/shared/fragments/post/post-feed';

export const tagScopedPublishedPostsQuery = q
  .parameters<{ tagId: string }>()
  .star.filterByType('page_post')
  .filterRaw(POST_IN_LOCALE_FILTER)
  .filterRaw(PUBLISHED_POST_FILTER)
  .filterRaw('references($tagId)')
  .order('publishedAt desc')
  .project(postFeedFragment);
