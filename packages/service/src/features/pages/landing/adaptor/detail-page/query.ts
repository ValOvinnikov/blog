import type { TPageLandingType } from '@shinefold/config';
import { q } from '@shinefold/service/sanity/query/query';
import {
  LANDING_PAGE_PATH_EXPRESSION,
  pagePathParser,
} from '@shinefold/service/shared/expressions/landing-page/landing-page-path';
import {
  LANDING_PAGE_SECTION_CHAIN_EXPRESSION,
  landingPageSectionChainParser,
} from '@shinefold/service/shared/expressions/landing-page/landing-page-section';
import { pageHeadingBlockFragment } from '@shinefold/service/shared/fragments/heading-block/page-heading-block';
import { moduleFragment } from '@shinefold/service/shared/fragments/module/module';
import { moduleContentAlignmentLeftCenterFragment } from '@shinefold/service/shared/fragments/module/module-content-alignment';
import { seoFragment } from '@shinefold/service/shared/fragments/seo/seo';
import { translationsQuery } from '@shinefold/service/shared/localization/page-translations/translations';
import type { TRawModule } from '@shinefold/service/shared/transformers/module/to-module';
import type { TPageQueryParams } from '@shinefold/service/shared/types/page/page-query-params';

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
    ...moduleContentAlignmentLeftCenterFragment,
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
