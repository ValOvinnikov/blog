import type { TPageTagIndexType } from '@blog/config';
import { q } from '@blog/service/sanity/query';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block';
import {
  MODULE_FIELDS_PROJECTION,
  moduleFragment,
} from '@blog/service/shared/fragments/module';
import { seoFragment } from '@blog/service/shared/fragments/seo';

export const tagIndexPageQuery = q.star
  .filterByType('page_tagIndex')
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
        moduleFragment<TPageTagIndexType>().project(MODULE_FIELDS_PROJECTION),
      )
      .nullable(true),
    modules: sub
      .field('modules[]')
      .deref()
      .project(
        moduleFragment<TPageTagIndexType>().project(MODULE_FIELDS_PROJECTION),
      )
      .nullable(true),
    seo: sub.field('seo').project(seoFragment).notNull(),
  }))
  // Nullable, not `.notNull()`: no `page_tagIndex` document is an
  // ordinary not-found, not a parse failure — the loader turns `null` into
  // `undefined`.
  .nullable(true);
