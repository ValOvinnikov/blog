import type { TPageLandingType } from '@blog/config';
import { q } from '@blog/service/sanity/query';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block/heading-block';
import { moduleFragment } from '@blog/service/shared/fragments/module/module';
import { seoFragment } from '@blog/service/shared/fragments/seo/seo';
import { translationsQuery } from '@blog/service/shared/localization/page-translations/translations';
import type { TRawModule } from '@blog/service/shared/transformers/module/to-module';
import type { TLocalizedSlugParams } from '@blog/service/shared/types/page';

export const landingPageQuery = q
  .parameters<TLocalizedSlugParams>()
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
    seo: sub.field('seo').project(seoFragment).notNull(),
    translations: translationsQuery,
  }))
  .nullable(true);
