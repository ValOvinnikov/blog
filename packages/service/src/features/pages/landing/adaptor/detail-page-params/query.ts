import type { TLocaleIsoCode } from '@blog/config/constants';
import { q } from '@blog/service/sanity/query/query';
import {
  LANDING_PAGE_PATH_EXPRESSION,
  pagePathParser,
} from '@blog/service/shared/expressions/landing-page/landing-page-path';

export type TLandingPageParamsQueryParams = {
  liveLocales: TLocaleIsoCode[];
};

export const landingPageParamsQuery = q
  .parameters<TLandingPageParamsQueryParams>()
  .star.filterByType('page_landing')
  // groqd's typed filterBy has no `in` operator
  .filterRaw(
    `language in $liveLocales && defined(${LANDING_PAGE_PATH_EXPRESSION})`,
  )
  .project((sub) => ({
    slug: sub.raw(LANDING_PAGE_PATH_EXPRESSION, pagePathParser.unwrap()),
    language: sub.field('language').notNull(),
  }));
