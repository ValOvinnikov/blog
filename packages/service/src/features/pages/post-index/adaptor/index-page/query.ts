import type { TPagePostIndexType } from '@blog/config';
import { q } from '@blog/service/sanity/query/query';
import { pageHeadingBlockFragment } from '@blog/service/shared/fragments/heading-block/page-heading-block';
import { moduleFragment } from '@blog/service/shared/fragments/module/module';
import { seoFragment } from '@blog/service/shared/fragments/seo/seo';
import type { TLocaleQueryParams } from '@blog/service/shared/localization/locale-query-params/locale-query-params';
import { pageLanguagesQuery } from '@blog/service/shared/localization/page-languages/page-languages';
import type { TRawModule } from '@blog/service/shared/transformers/module/to-module';

export const blogPageQuery = q
  .parameters<TLocaleQueryParams>()
  .star.filterByType('page_postIndex')
  // groqd's typed filterBy has no coalesce, and a page with no language is the default language's
  .filterRaw('coalesce(language, $defaultLocale) == $locale')
  .slice(0)
  .project((sub) => ({
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
      .as<TRawModule<TPagePostIndexType>>()
      .nullable(),
    modules: sub
      .field('template')
      .deref()
      .field('modules[]')
      .deref()
      .project(moduleFragment)
      .as<TRawModule<TPagePostIndexType>[]>()
      .nullable(),
    seo: sub.field('seo').project(seoFragment).notNull(),
    translations: pageLanguagesQuery('page_postIndex'),
  }))
  .nullable(true);
