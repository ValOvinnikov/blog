import type { TPageHomeType } from '@blog/config';
import { q } from '@blog/service/sanity/query';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block/heading-block';
import { moduleFragment } from '@blog/service/shared/fragments/module/module';
import { seoFragment } from '@blog/service/shared/fragments/seo/seo';
import type { TRawModule } from '@blog/service/shared/transformers/module/to-module';

export const homePageQuery = q.star
  .filterByType('page_home')
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
      .as<TRawModule<TPageHomeType>>()
      .nullable(),
    modules: sub
      .field('modules[]')
      .deref()
      .project(moduleFragment)
      .as<TRawModule<TPageHomeType>[]>()
      .nullable(),
    seo: sub.field('seo').project(seoFragment).notNull(),
  }))
  .nullable(true);
