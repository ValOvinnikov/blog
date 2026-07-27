import { q, type TSlugParams } from '@blog/service/sanity/query';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/filters/published-post';
import { postDetailFragment } from '@blog/service/shared/fragments/post';

// A future-dated post has no query-time draft/preview mode in this app, so
// gating on `PUBLISHED_POST_FILTER` here makes its own `/blog/[slug]` page
// hard-404 (via `getPost`'s null result) on direct access, not just excluded
// from listings/feeds/related-posts/sitemap.
export const postDetailQuery = q
  .parameters<TSlugParams>()
  .star.filterByType('blog_post')
  .filterBy('slug.current == $slug')
  .filterRaw(PUBLISHED_POST_FILTER)
  .slice(0)
  .project(postDetailFragment);
