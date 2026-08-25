import { q } from '@blog/service/sanity/query';
import { moduleFragment } from '@blog/service/shared/fragments/module';
import { seoFragment } from '@blog/service/shared/fragments/seo';

export const blogPageQuery = q.star
  .filterByType('page_blog')
  .slice(0)
  .project((sub) => ({
    heading: sub.field('heading').notNull(),
    supportingText: sub.field('supportingText').nullable(true),
    postList: sub
      .field('postList')
      .deref()
      .project(() => ({
        _id: true,
      }))
      .nullable(true),
    // Page-builder placement (`cta`/`newsletter`), mirroring
    // `page_home`/`page_generic`'s own thin `modules[]` ref projection —
    // resolved to a real component by `ModuleRenderer` (`apps/web`).
    modules: sub
      .field('modules[]')
      .deref()
      .project(moduleFragment)
      .nullable(true),
    seo: sub.field('seo').project(seoFragment).nullable(true),
  }))
  // Nullable, not `.notNull()`: no `page_blog` document is an ordinary
  // not-found, not a parse failure — the loader turns `null` into
  // `undefined`.
  .nullable(true);
