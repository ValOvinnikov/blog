import type { TLocaleIsoCode } from '@blog/config/constants';
import { q } from '@blog/service/sanity/query/query';

export type TLandingPageParamsQueryParams = {
  liveLocales: TLocaleIsoCode[];
};

export const landingPageParamsQuery = q
  .parameters<TLandingPageParamsQueryParams>()
  .star.filterByType('page_landing')
  // groqd's typed filterBy has no `in` operator
  .filterRaw('language in $liveLocales')
  .project((sub) => ({
    slug: sub.field('slug.current').notNull(),
    language: sub.field('language').notNull(),
  }));
