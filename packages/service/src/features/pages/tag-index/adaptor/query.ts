import type { TPageTagIndexType } from '@blog/config';
import { q } from '@blog/service/sanity/query/query';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block/heading-block';
import { moduleFragment } from '@blog/service/shared/fragments/module/module';
import { seoFragment } from '@blog/service/shared/fragments/seo/seo';
import type { TLocaleParams } from '@blog/service/shared/localization/locale-params/locale-params';
import { pageLanguagesQuery } from '@blog/service/shared/localization/page-languages/page-languages';
import type { TRawModule } from '@blog/service/shared/transformers/module/to-module';

export const tagIndexPageQuery = q
  .parameters<TLocaleParams>()
  .star.filterByType('page_tagIndex')
  // groqd's typed filterBy has no coalesce, and a page with no language is the default language's
  .filterRaw('coalesce(language, $defaultLocale) == $locale')
  .slice(0)
  .project((sub) => ({
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
      .as<TRawModule<TPageTagIndexType>>()
      .nullable(),
    modules: sub
      .field('template')
      .deref()
      .field('modules[]')
      .deref()
      .project(moduleFragment)
      .as<TRawModule<TPageTagIndexType>[]>()
      .nullable(),
    seo: sub.field('seo').project(seoFragment).notNull(),
    translations: pageLanguagesQuery('page_tagIndex'),
  }))
  .nullable(true);
