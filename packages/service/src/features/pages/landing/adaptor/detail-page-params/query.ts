import { q } from '@blog/service/sanity/query/query';
import {
  LANDING_PAGE_PATH_EXPRESSION,
  pagePathParser,
} from '@blog/service/shared/expressions/landing-page/landing-page-path';
import type { TPageQueryPageParams } from '@blog/service/shared/types/page/page-query-page-params';

export const landingPageParamsQuery = q
  .parameters<TPageQueryPageParams>()
  .star.filterByType('page_landing')
  // groqd's typed filterBy has no `in` operator
  .filterRaw(`language in $locales && defined(${LANDING_PAGE_PATH_EXPRESSION})`)
  .project((sub) => ({
    slug: sub.raw(LANDING_PAGE_PATH_EXPRESSION, pagePathParser.unwrap()),
    language: sub.field('language').notNull(),
  }));
