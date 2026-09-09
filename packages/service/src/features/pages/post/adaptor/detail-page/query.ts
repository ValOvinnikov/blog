import { q, type TSlugParams } from '@blog/service/sanity/query';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/filters/published-post';
import { postDetailFragment } from '@blog/service/shared/fragments/post';

// A post's content and its page are the same `page_post` document. Gating
// on `PUBLISHED_POST_FILTER` makes `/blog/[slug]` hard-404 on direct access
// to a scheduled post, not just excluded from listings/feeds/sitemap.
export const postPageQuery = q
  .parameters<TSlugParams>()
  .star.filterByType('page_post')
  .filterBy('slug.current == $slug')
  .filterRaw(PUBLISHED_POST_FILTER)
  .slice(0)
  .project(postDetailFragment)
  // Nullable, not `.notNull()`: no matching `page_post` is an ordinary
  // not-found, not a parse failure — the loader turns `null` into `undefined`.
  .nullable(true);
