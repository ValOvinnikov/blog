import { q } from '@blog/service/sanity/query/query';
import { FEATURED_POST_FILTER } from '@blog/service/shared/expressions/post/featured-post';
import { postCardFragment } from '@blog/service/shared/fragments/post/post';
import type { TLocaleQueryParams } from '@blog/service/shared/localization/locale-query-params/locale-query-params';
import { publishedPostsInLocale } from '@blog/service/shared/localization/published-posts-in-locale/published-posts-in-locale';

// `.slice(0)` yields null when no post matches; without `.nullable(true)` groqd throws at parse time.
export const heroFallbackFeaturedPostQuery = publishedPostsInLocale(
  q.parameters<TLocaleQueryParams>().star,
)
  .filterRaw(FEATURED_POST_FILTER)
  .order('publishedAt desc')
  .slice(0)
  .project(postCardFragment)
  .nullable(true);
