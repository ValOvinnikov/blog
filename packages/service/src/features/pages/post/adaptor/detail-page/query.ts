import { q, type TSlugParams } from '@blog/service/sanity/query';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/filters/published-post';
import { postDetailFragment } from '@blog/service/shared/fragments/post';
import { seoFragment } from '@blog/service/shared/fragments/seo';

// Resolves by `page_post.slug` — the page-level slug — not `post.slug`;
// `post` is only deref'd for its content. A future-dated `page_post` has no
// query-time draft/preview mode in this app, so gating on
// `PUBLISHED_POST_FILTER` here (scoped to `page_post.publishedAt`, the
// page-level publish date) makes `/blog/[slug]` hard-404 on direct access,
// not just excluded from listings/feeds/related-posts/sitemap.
export const postPageQuery = q
  .parameters<TSlugParams>()
  .star.filterByType('page_post')
  .filterBy('slug.current == $slug')
  .filterRaw(PUBLISHED_POST_FILTER)
  .slice(0)
  .project((sub) => ({
    slug: sub.field('slug.current').notNull(),
    publishedAt: sub.field('publishedAt').notNull(),
    seo: sub.field('seo').project(seoFragment).nullable(true),
    post: sub.field('post').deref().project(postDetailFragment).notNull(),
  }));
