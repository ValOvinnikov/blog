import { q, type TSlugParams } from '@blog/service/sanity/query';
import { seoFragment } from '@blog/service/shared/fragments/seo';
import { tagFragment } from '@blog/service/shared/fragments/tag';

// The tag *page* needs more than the minimal `{_id,title,slug}` chip shape
// `tagFragment` provides (that stays minimal for the post-detail tags
// projection) — it also needs `description`/`seo` to render/derive its own
// metadata, so it spreads `tagFragment` and adds the extra fields.
export const tagPageTagQuery = q
  .parameters<TSlugParams>()
  .star.filterByType('blog_tag')
  .filterBy('slug.current == $slug')
  .slice(0)
  .project((sub) => ({
    ...tagFragment,
    description: sub.field('description').nullable(true),
    seo: sub.field('seo').project(seoFragment).nullable(true),
  }));
