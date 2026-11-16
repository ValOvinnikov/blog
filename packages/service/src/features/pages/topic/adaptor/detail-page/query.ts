import type { TPageTopicType } from '@shinefold/config';
import { q } from '@shinefold/service/sanity/query/query';
import { pageHeadingBlockFragment } from '@shinefold/service/shared/fragments/heading-block/page-heading-block';
import { moduleFragment } from '@shinefold/service/shared/fragments/module/module';
import { moduleContentAlignmentLeftCenterFragment } from '@shinefold/service/shared/fragments/module/module-content-alignment';
import { seoFragment } from '@shinefold/service/shared/fragments/seo/seo';
import { topicFragment } from '@shinefold/service/shared/fragments/topic/topic';
import { translationsQuery } from '@shinefold/service/shared/localization/page-translations/translations';
import type { TRawModule } from '@shinefold/service/shared/transformers/module/to-module';
import type { TPageQueryParams } from '@shinefold/service/shared/types/page/page-query-params';

export const topicPageQuery = q
  .parameters<TPageQueryParams>()
  .star.filterByType('page_topic')
  .filterBy('slug.current == $slug')
  .filterBy('language == $locale')
  .slice(0)
  .project((sub) => ({
    topic: sub.field('topic').deref().project(topicFragment).notNull(),
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
      .as<TRawModule<TPageTopicType>>()
      .nullable(),
    modules: sub
      .field('template')
      .deref()
      .field('modules[]')
      .deref()
      .project(moduleFragment)
      .as<TRawModule<TPageTopicType>[]>()
      .nullable(),
    seo: sub.field('seo').project(seoFragment).notNull(),
    translations: translationsQuery,
  }))
  .nullable(true);
