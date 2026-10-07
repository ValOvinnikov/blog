import { q } from '@blog/service/sanity/query/query';
import type { TLocaleQueryParams } from '@blog/service/shared/localization/locale-query-params/locale-query-params';
import { publishedPostsInLocale } from '@blog/service/shared/localization/published-posts-in-locale/published-posts-in-locale';

export const indexPageParamsQuery = q
  .parameters<TLocaleQueryParams>()
  .star.filterByType('page_postIndex')
  // groqd's typed filterBy has no coalesce, and a page with no language is the default language's
  .filterRaw('coalesce(language, $defaultLocale) == $locale')
  .slice(0)
  .project((page) => ({
    blogPosts: q.project((sub) => ({
      total: sub
        .count(publishedPostsInLocale(q.parameters<TLocaleQueryParams>().star))
        .notNull(true),
    })),
    moduleRefs: page
      .field('template')
      .deref()
      .field('modules[]')
      .project(() => ({ _ref: true }))
      .nullable(true),
  }))
  .notNull();
