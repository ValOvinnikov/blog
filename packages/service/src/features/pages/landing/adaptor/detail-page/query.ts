import { q, type TSlugParams } from '@blog/service/sanity/query';
import { moduleFragment } from '@blog/service/shared/fragments/module';
import { seoFragment } from '@blog/service/shared/fragments/seo';

export const landingPageQuery = q
  .parameters<TSlugParams>()
  .star.filterByType('page_landing')
  .filterBy('slug.current == $slug')
  .slice(0)
  .project((sub) => ({
    title: sub.field('title').notNull(),
    slug: sub.field('slug.current').notNull(),
    hero: sub.field('hero').deref().project(moduleFragment).nullable(true),
    modules: sub
      .field('modules[]')
      .deref()
      .project(moduleFragment)
      .nullable(true),
    seo: sub.field('seo').project(seoFragment).nullable(true),
  }))
  // Nullable, not `.notNull()`: no matching `page_landing` is an ordinary
  // not-found, not a parse failure — the loader turns `null` into `undefined`.
  .nullable(true);
