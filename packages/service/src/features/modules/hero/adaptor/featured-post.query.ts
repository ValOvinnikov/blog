import { q } from '@blog/service/sanity/query';
import { postCardFragment } from '@blog/service/shared/fragments/post';

// Fallback when the hero module has no `featuredPost` configured: newest
// post marked `featured`. `.slice(0)` yields null when no post matches (e.g.
// a fresh dataset with no featured post yet), so mark the query nullable —
// otherwise groqd throws at parse time instead of returning null.
export const heroFallbackFeaturedPostQuery = q.star
  .filterByType('blog_post')
  .filterRaw('featured == true')
  .order('publishedAt desc')
  .slice(0)
  .project(postCardFragment)
  .nullable(true);
