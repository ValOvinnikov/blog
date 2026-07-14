import { q, type TSlugParams } from '@blog/service/sanity/query';
import { moduleFragment } from '@blog/service/shared/fragments/module';
import { seoFragment } from '@blog/service/shared/fragments/seo';

export const genericPageQuery = q
  .parameters<TSlugParams>()
  .star.filterByType('page_generic')
  .filterBy('slug.current == $slug')
  .slice(0)
  .project((sub) => ({
    title: sub.field('title').notNull(),
    slug: sub.field('slug.current').notNull(),
    modules: sub
      .field('modules[]')
      .deref()
      .project(moduleFragment)
      .nullable(true),
    seo: sub.field('seo').project(seoFragment).nullable(true),
  }))
  .notNull();
