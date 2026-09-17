import type { TPageLandingType } from '@blog/config';
import { q, type TSlugParams } from '@blog/service/sanity/query';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block';
import { moduleFragment } from '@blog/service/shared/fragments/module';
import { seoFragment } from '@blog/service/shared/fragments/seo';
import type { TRawModule } from '@blog/service/shared/transformers/to-module';

export const landingPageQuery = q
  .parameters<TSlugParams>()
  .star.filterByType('page_landing')
  .filterBy('slug.current == $slug')
  .slice(0)
  .project((sub) => ({
    slug: sub.field('slug.current').notNull(),
    headingBlock: sub
      .field('headingBlock')
      .project(headingBlockFragment)
      .notNull(),
    hero: sub
      .field('hero')
      .deref()
      .project(moduleFragment)
      .as<TRawModule<TPageLandingType>>()
      .nullable(),
    modules: sub
      .field('modules[]')
      .deref()
      .project(moduleFragment)
      .as<TRawModule<TPageLandingType>[]>()
      .nullable(),
    seo: sub.field('seo').project(seoFragment).notNull(),
  }))
  // Nullable, not `.notNull()`: no matching `page_landing` is an ordinary
  // not-found, not a parse failure — the loader turns `null` into `undefined`.
  .nullable(true);
