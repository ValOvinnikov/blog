import type { TPageTopicType } from '@blog/config';
import { q, type TSlugParams } from '@blog/service/sanity/query';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block/heading-block';
import { moduleFragment } from '@blog/service/shared/fragments/module/module';
import { seoFragment } from '@blog/service/shared/fragments/seo/seo';
import { topicFragment } from '@blog/service/shared/fragments/topic/topic';
import type { TRawModule } from '@blog/service/shared/transformers/module/to-module/to-module';

export const topicPageQuery = q
  .parameters<TSlugParams>()
  .star.filterByType('page_topic')
  .filterBy('slug.current == $slug')
  .slice(0)
  .project((sub) => ({
    topic: sub.field('topic').deref().project(topicFragment).notNull(),
    headingBlock: sub
      .field('headingBlock')
      .project(headingBlockFragment)
      .notNull(),
    hero: sub
      .field('hero')
      .deref()
      .project(moduleFragment)
      .as<TRawModule<TPageTopicType>>()
      .nullable(),
    modules: sub
      .field('modules[]')
      .deref()
      .project(moduleFragment)
      .as<TRawModule<TPageTopicType>[]>()
      .nullable(),
    seo: sub.field('seo').project(seoFragment).notNull(),
  }))
  .nullable(true);
