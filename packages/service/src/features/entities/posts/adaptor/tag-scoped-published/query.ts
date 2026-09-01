import { q } from '@blog/service/sanity/query';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/filters/published-post';
import { feedPostFragment } from '@blog/service/shared/fragments/feed-post';

/**
 * Every published post tagged with `$tagId`, newest first — the tag-scoped
 * counterpart to `allPublishedPostsQuery` for a tag's own RSS/Atom feed. The
 * caller already holds the tag's own `_id` (from
 * `service.pages.tag.v1.getTagPage`), so this matches directly by reference
 * identity rather than looking up an enclosing document, unlike
 * `postListModulePaginatedPostsQuery`'s tag-scope filter.
 */
export const tagScopedPublishedPostsQuery = q
  .parameters<{ tagId: string }>()
  .star.filterByType('blog_post')
  .filterRaw(PUBLISHED_POST_FILTER)
  .filterRaw('references($tagId)')
  .order('publishedAt desc')
  .project(feedPostFragment);
