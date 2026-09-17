import type { TPagePostIndexType } from '@blog/config';
import { q } from '@blog/service/sanity/query';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block';
import { moduleFragment } from '@blog/service/shared/fragments/module';
import { seoFragment } from '@blog/service/shared/fragments/seo';
import type { TRawModule } from '@blog/service/shared/transformers/to-module';

export const blogPageQuery = q.star
  .filterByType('page_postIndex')
  .slice(0)
  .project((sub) => ({
    headingBlock: sub
      .field('headingBlock')
      .project(headingBlockFragment)
      .notNull(),
    hero: sub
      .field('hero')
      .deref()
      .project(moduleFragment)
      .as<TRawModule<TPagePostIndexType>>()
      .nullable(),
    // Page-builder placement (`cta`/`newsletter`/`postList`), mirroring
    // `page_home`/`page_landing`'s own thin `modules[]` ref projection —
    // resolved to a real component by `ModuleRenderer` (`apps/web`).
    modules: sub
      .field('modules[]')
      .deref()
      .project(moduleFragment)
      .as<TRawModule<TPagePostIndexType>[]>()
      .nullable(),
    seo: sub.field('seo').project(seoFragment).notNull(),
  }))
  // Nullable, not `.notNull()`: no `page_postIndex` document is an ordinary
  // not-found, not a parse failure — the loader turns `null` into
  // `undefined`.
  .nullable(true);
