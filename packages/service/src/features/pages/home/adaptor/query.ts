import { q } from '@blog/service/sanity/query';
import { moduleFragment } from '@blog/service/shared/fragments/module';
import { seoFragment } from '@blog/service/shared/fragments/seo';

export const homePageQuery = q.star
  .filterByType('page_home')
  .slice(0)
  .project((sub) => ({
    title: sub.field('title').notNull(),
    hero: sub.field('hero').deref().project(moduleFragment).notNull(),
    modules: sub
      .field('modules[]')
      .deref()
      .project(moduleFragment)
      .nullable(true),
    seo: sub.field('seo').project(seoFragment).nullable(true),
  }))
  .notNull();
