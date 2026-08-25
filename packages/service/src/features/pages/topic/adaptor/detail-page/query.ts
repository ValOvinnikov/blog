import { q, type TSlugParams } from '@blog/service/sanity/query';
import { moduleFragment } from '@blog/service/shared/fragments/module';
import { seoFragment } from '@blog/service/shared/fragments/seo';
import { topicFragment } from '@blog/service/shared/fragments/topic';

export const topicPageQuery = q
  .parameters<TSlugParams>()
  .star.filterByType('page_topic')
  .filterBy('slug.current == $slug')
  .slice(0)
  .project((sub) => ({
    topic: sub.field('topic').deref().project(topicFragment).notNull(),
    postList: sub
      .field('postList')
      .deref()
      .project(() => ({
        _id: true,
      }))
      .nullable(true),
    // Page-builder placement (`postLatest`/`cta`/`newsletter`), mirroring
    // `page_blog`'s own thin `modules[]` ref projection — resolved to a
    // real component by `ModuleRenderer` (`apps/web`).
    modules: sub
      .field('modules[]')
      .deref()
      .project(moduleFragment)
      .nullable(true),
    seo: sub.field('seo').project(seoFragment).nullable(true),
  }))
  // Nullable, not `.notNull()`: no matching `page_topic` is an ordinary
  // not-found, not a parse failure — the loader turns `null` into `undefined`.
  .nullable(true);
