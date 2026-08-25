import { q, type TSlugParams } from '@blog/service/sanity/query';
import { moduleFragment } from '@blog/service/shared/fragments/module';
import { seoFragment } from '@blog/service/shared/fragments/seo';
import { tagFragment } from '@blog/service/shared/fragments/tag';

export const tagPageQuery = q
  .parameters<TSlugParams>()
  .star.filterByType('page_tag')
  .filterBy('slug.current == $slug')
  .slice(0)
  .project((sub) => ({
    // The tag *page* needs more than the minimal `{_id,title,slug}` chip
    // shape `tagFragment` provides (that stays minimal for the post-detail
    // tags projection) — it also needs `description` to derive its own
    // metadata, so it spreads `tagFragment` and adds the extra field.
    tag: sub
      .field('tag')
      .deref()
      .project((tagSub) => ({
        ...tagFragment,
        description: tagSub.field('description').nullable(true),
      }))
      .notNull(),
    postList: sub
      .field('postList')
      .deref()
      .project(() => ({
        _id: true,
      }))
      .nullable(true),
    modules: sub
      .field('modules[]')
      .deref()
      .project(moduleFragment)
      .nullable(true),
    seo: sub.field('seo').project(seoFragment).nullable(true),
  }))
  // Nullable, not `.notNull()`: no matching `page_tag` is an ordinary
  // not-found, not a parse failure — the loader turns `null` into `undefined`.
  .nullable(true);
