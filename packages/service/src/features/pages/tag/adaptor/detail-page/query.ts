import type { TPageTagType } from '@blog/config';
import { q } from '@blog/service/sanity/query/query';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block/heading-block';
import { moduleFragment } from '@blog/service/shared/fragments/module/module';
import { seoFragment } from '@blog/service/shared/fragments/seo/seo';
import { tagFragment } from '@blog/service/shared/fragments/tag/tag';
import { getLocalizedField } from '@blog/service/shared/localization/get-localized-field/get-localized-field';
import { translationsQuery } from '@blog/service/shared/localization/page-translations/translations';
import type { TRawModule } from '@blog/service/shared/transformers/module/to-module';
import type { TPageQueryParams } from '@blog/service/shared/types/page/page-query-params';

export const tagPageQuery = q
  .parameters<TPageQueryParams>()
  .star.filterByType('page_tag')
  .filterBy('slug.current == $slug')
  .filterBy('language == $locale')
  .slice(0)
  .project((sub) => ({
    tag: sub
      .field('tag')
      .deref()
      .project((tagSub) => ({
        ...tagFragment,
        description: getLocalizedField(tagSub, 'description'),
      }))
      .notNull(),
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
      .as<TRawModule<TPageTagType>>()
      .nullable(),
    modules: sub
      .field('template')
      .deref()
      .field('modules[]')
      .deref()
      .project(moduleFragment)
      .as<TRawModule<TPageTagType>[]>()
      .nullable(),
    seo: sub.field('seo').project(seoFragment).notNull(),
    translations: translationsQuery,
  }))
  .nullable(true);
