import { q } from '#/sanity/query';
import { postCardFragment } from '#/shared/fragments/post';

// Fallback when the hero module has no `featuredPost` configured: newest
// post marked `featured`.
export const heroFallbackFeaturedPostQuery = q.star
  .filterByType('post')
  .filterRaw('featured == true')
  .order('publishedAt desc')
  .slice(0)
  .project(postCardFragment);
