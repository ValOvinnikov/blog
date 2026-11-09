import type { TPageLandingType } from '@blog/config';
import { q } from '@blog/service/sanity/query/query';
import { pageHeadingBlockFragment } from '@blog/service/shared/fragments/heading-block/page-heading-block';
import { moduleFragment } from '@blog/service/shared/fragments/module/module';
import { moduleContentAlignmentLeftCenterFragment } from '@blog/service/shared/fragments/module/module-content-alignment';
import { seoFragment } from '@blog/service/shared/fragments/seo/seo';
import type { TLocaleQueryParams } from '@blog/service/shared/localization/locale-query-params/locale-query-params';
import { pageLanguagesQuery } from '@blog/service/shared/localization/page-languages/page-languages';
import type { TRawModule } from '@blog/service/shared/transformers/module/to-module';

import type { TSectionIndexType } from './types';

export function sectionIndexPageQuery(type: TSectionIndexType) {
  return q
    .parameters<TLocaleQueryParams>()
    .star.filterByType(type)
    .filterBy('language == $locale')
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
      translations: pageLanguagesQuery(type),
    }))
    .nullable(true);
}
