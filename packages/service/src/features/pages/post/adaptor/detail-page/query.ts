import { q } from '@shinefold/service/sanity/query/query';
import { PUBLISHED_POST_FILTER } from '@shinefold/service/shared/expressions/post/published-post';
import { postDetailFragment } from '@shinefold/service/shared/fragments/post/post';
import { translationsQuery } from '@shinefold/service/shared/localization/page-translations/translations';
import type { TPageQueryParams } from '@shinefold/service/shared/types/page/page-query-params';

type TPostPageQueryParams = TPageQueryParams & { isDraftPreview: boolean };

// Outside a draft preview, gating on `PUBLISHED_POST_FILTER` makes `/blog/[slug]` hard-404 on direct access to a scheduled post, not just excluded from listings.
export const postPageQuery = q
  .parameters<TPostPageQueryParams>()
  .star.filterByType('page_post')
  .filterBy('slug.current == $slug')
  .filterBy('language == $locale')
  .filterRaw(`($isDraftPreview || ${PUBLISHED_POST_FILTER})`)
  .slice(0)
  .project(() => ({
    ...postDetailFragment,
    translations: translationsQuery,
  }))
  .nullable(true);
