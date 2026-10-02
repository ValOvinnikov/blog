import type { TLocaleIsoCode } from '@blog/config/constants';
import { q } from '@blog/service/sanity/query';

export type TLandingPageParamsQueryParams = {
  liveLocales: TLocaleIsoCode[];
};

export const landingPageParamsQuery = q
  .parameters<TLandingPageParamsQueryParams>()
  .star.filterByType('page_landing')
  .filterRaw('coalesce(language, $defaultLocale) in $liveLocales')
  .project((sub) => ({
    slug: sub.field('slug.current').notNull(),
    language: sub.raw<TLocaleIsoCode>('coalesce(language, $defaultLocale)'),
  }));
