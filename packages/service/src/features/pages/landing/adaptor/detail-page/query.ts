import type { TPageLandingType } from '@blog/config';
import { q, type TSlugParams } from '@blog/service/sanity/query';
import {
  PAGE_FAQ_QUESTIONS_EXPRESSION,
  pageFaqQuestionsParser,
} from '@blog/service/shared/expressions/page-faq-questions';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block/heading-block';
import { moduleFragment } from '@blog/service/shared/fragments/module/module';
import { seoFragment } from '@blog/service/shared/fragments/seo/seo';
import type { TLocaleParams } from '@blog/service/shared/localization/locale-params';
import { translationsQuery } from '@blog/service/shared/localization/translations';
import type { TRawModule } from '@blog/service/shared/transformers/module/to-module';

export const landingPageQuery = q
  .parameters<TSlugParams & Partial<TLocaleParams>>()
  .star.filterByType('page_landing')
  .filterBy('slug.current == $slug')
  .filterBy('language == $locale')
  .slice(0)
  .project((sub) => ({
    slug: sub.field('slug.current').notNull(),
    headingBlock: sub
      .field('headingBlock')
      .project(headingBlockFragment)
      .notNull(),
    hero: sub
      .field('hero')
      .deref()
      .project(moduleFragment)
      .as<TRawModule<TPageLandingType>>()
      .nullable(),
    modules: sub
      .field('modules[]')
      .deref()
      .project(moduleFragment)
      .as<TRawModule<TPageLandingType>[]>()
      .nullable(),
    faqs: sub.raw(PAGE_FAQ_QUESTIONS_EXPRESSION, pageFaqQuestionsParser),
    seo: sub.field('seo').project(seoFragment).notNull(),
    translations: translationsQuery,
  }))
  .nullable(true);
