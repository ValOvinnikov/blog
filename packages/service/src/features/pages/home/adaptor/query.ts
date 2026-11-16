import type { TPageHomeType } from '@shinefold/config';
import { q } from '@shinefold/service/sanity/query/query';
import { pageHeadingBlockFragment } from '@shinefold/service/shared/fragments/heading-block/page-heading-block';
import { moduleFragment } from '@shinefold/service/shared/fragments/module/module';
import { moduleContentAlignmentLeftCenterFragment } from '@shinefold/service/shared/fragments/module/module-content-alignment';
import { seoFragment } from '@shinefold/service/shared/fragments/seo/seo';
import type { TLocaleQueryParams } from '@shinefold/service/shared/localization/locale-query-params/locale-query-params';
import { pageLanguagesQuery } from '@shinefold/service/shared/localization/page-languages/page-languages';
import type { TRawModule } from '@shinefold/service/shared/transformers/module/to-module';

export const homePageQuery = q
  .parameters<TLocaleQueryParams>()
  .star.filterByType('page_home')
  // groqd's typed filterBy has no coalesce, and a Home with no language is the default language's
  .filterRaw('coalesce(language, $defaultLocale) == $locale')
  .slice(0)
  .project((sub) => ({
    _id: true,
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
      .as<TRawModule<TPageHomeType>>()
      .nullable(),
    modules: sub
      .field('template')
      .deref()
      .field('modules[]')
      .deref()
      .project(moduleFragment)
      .as<TRawModule<TPageHomeType>[]>()
      .nullable(),
    seo: sub.field('seo').project(seoFragment).notNull(),
    translations: pageLanguagesQuery('page_home'),
  }))
  .nullable(true);
