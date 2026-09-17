import type { TPageTopicIndexType } from '@blog/config';
import { q } from '@blog/service/sanity/query';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block';
import {
  MODULE_FIELDS_PROJECTION,
  moduleFragmentRoot,
} from '@blog/service/shared/fragments/module';
import { seoFragment } from '@blog/service/shared/fragments/seo';

export const topicIndexPageQuery = q.star
  .filterByType('page_topicIndex')
  .slice(0)
  .project((sub) => ({
    headingBlock: sub
      .field('headingBlock')
      .project(headingBlockFragment)
      .notNull(),
    hero: sub
      .field('hero')
      .deref()
      .project(
        moduleFragmentRoot<TPageTopicIndexType>().project(
          MODULE_FIELDS_PROJECTION,
        ),
      )
      .nullable(true),
    modules: sub
      .field('modules[]')
      .deref()
      .project(
        moduleFragmentRoot<TPageTopicIndexType>().project(
          MODULE_FIELDS_PROJECTION,
        ),
      )
      .nullable(true),
    seo: sub.field('seo').project(seoFragment).notNull(),
  }))
  // Nullable, not `.notNull()`: no `page_topicIndex` document is an
  // ordinary not-found, not a parse failure — the loader turns `null` into
  // `undefined`.
  .nullable(true);
