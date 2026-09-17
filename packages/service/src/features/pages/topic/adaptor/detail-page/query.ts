import type { TPageTopicType } from '@blog/config';
import { q, type TSlugParams } from '@blog/service/sanity/query';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block';
import { moduleFragment } from '@blog/service/shared/fragments/module';
import { seoFragment } from '@blog/service/shared/fragments/seo';
import { topicFragment } from '@blog/service/shared/fragments/topic';
import type { TRawModule } from '@blog/service/shared/transformers/to-module';

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
  // Nullable, not `.notNull()`: no matching `page_topic` is an ordinary
  // not-found, not a parse failure — the loader turns `null` into `undefined`.
  .nullable(true);
