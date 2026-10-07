import type { TPageLandingType } from '@blog/config';
import { q } from '@blog/service/sanity/query/query';
import {
  LANDING_PAGE_PATH_EXPRESSION,
  pagePathParser,
} from '@blog/service/shared/expressions/landing-page/landing-page-path';
import {
  LANDING_PAGE_SECTION_CHAIN_EXPRESSION,
  landingPageSectionChainParser,
} from '@blog/service/shared/expressions/landing-page/landing-page-section';
import { pageHeadingBlockFragment } from '@blog/service/shared/fragments/heading-block/page-heading-block';
import { moduleFragment } from '@blog/service/shared/fragments/module/module';
import { seoFragment } from '@blog/service/shared/fragments/seo/seo';
import { translationsQuery } from '@blog/service/shared/localization/page-translations/translations';
import type { TRawModule } from '@blog/service/shared/transformers/module/to-module';
import type { TPageQueryParams } from '@blog/service/shared/types/page/page-query-params';

export const landingPageQuery = q
  .parameters<TPageQueryParams & { path: string }>()
  .star.filterByType('page_landing')
  .filterBy('slug.current == $slug')
  .filterBy('language == $locale')
  // groqd's typed filterBy cannot type the computed path expression
  .filterRaw(`${LANDING_PAGE_PATH_EXPRESSION} == $path`)
  .slice(0)
  .project((sub) => ({
    _id: true,
    path: sub.raw(LANDING_PAGE_PATH_EXPRESSION, pagePathParser.unwrap()),
    headingBlock: sub
      .field('headingBlock')
      .project(pageHeadingBlockFragment)
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
    showSectionNavigation: sub.field('showSectionNavigation').nullable(true),
    sectionChain: sub.raw(
      LANDING_PAGE_SECTION_CHAIN_EXPRESSION,
      landingPageSectionChainParser,
    ),
    translations: translationsQuery,
  }))
  .nullable(true);
