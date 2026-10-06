import type { TPageLandingType } from '@blog/config';
import type { TLocaleIsoCode } from '@blog/config/constants';
import { q } from '@blog/service/sanity/query/query';
import {
  LANDING_PAGE_PATH_EXPRESSION,
  pagePathParser,
} from '@blog/service/shared/expressions/landing-page/landing-page-path';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block/heading-block';
import { moduleFragment } from '@blog/service/shared/fragments/module/module';
import { seoFragment } from '@blog/service/shared/fragments/seo/seo';
import { translationsQuery } from '@blog/service/shared/localization/page-translations/translations';
import type { TRawModule } from '@blog/service/shared/transformers/module/to-module';

export type TLandingPageParams = {
  slug: string;
  path: string;
  locale: TLocaleIsoCode;
};

export const landingPageQuery = q
  .parameters<TLandingPageParams>()
  .star.filterByType('page_landing')
  .filterBy('slug.current == $slug')
  .filterBy('language == $locale')
  .filterRaw(`${LANDING_PAGE_PATH_EXPRESSION} == $path`)
  .slice(0)
  .project((sub) => ({
    path: sub.raw(LANDING_PAGE_PATH_EXPRESSION, pagePathParser.unwrap()),
    headingBlock: sub
      .field('headingBlock')
      .project(headingBlockFragment)
      .notNull(),
    hero: sub
      .field('template')
      .deref()
      .field('hero')
      .deref()
      .project(moduleFragment)
      .as<TRawModule<TPageLandingType>>()
      .nullable(),
    modules: sub
      .field('template')
      .deref()
      .field('modules[]')
      .deref()
      .project(moduleFragment)
      .as<TRawModule<TPageLandingType>[]>()
      .nullable(),
    seo: sub.field('seo').project(seoFragment).notNull(),
    translations: translationsQuery,
  }))
  .nullable(true);
