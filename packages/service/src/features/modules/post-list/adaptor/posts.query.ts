import { TAXONOMY_KIND, type TTaxonomyKind } from '@blog/config';
import { q } from '@blog/service/sanity/query';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/filters/published-post';
import { postCardFragment } from '@blog/service/shared/fragments/post';

export type TPostListScope = {
  kind: TTaxonomyKind;
  slug: string;
};

const SCOPE_TAXONOMY_TYPE: Record<TTaxonomyKind, string> = {
  [TAXONOMY_KIND.TAGS]: 'blog_tag',
  [TAXONOMY_KIND.TOPICS]: 'blog_topic',
};

function scopeFilter(kind: TTaxonomyKind) {
  return `references(*[_type == "${SCOPE_TAXONOMY_TYPE[kind]}" && slug.current == $scopeSlug][0]._id)`;
}

/**
 * Windowed posts for the post-list archive, alongside the total match count
 * so the caller can compute total pages. Built per-request so `pageSize`
 * bounds the results in GROQ (end-exclusive `.slice(start, end)`); `scope`
 * restricts the results to the tag/topic it names, and is omitted entirely
 * (no predicate at all) for an unscoped listing.
 */
export function postListModulePaginatedPostsQuery(
  page: number,
  pageSize: number,
  scope?: TPostListScope,
) {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  const posts = scope
    ? q.star
        .filterByType('page_post')
        .filterRaw(PUBLISHED_POST_FILTER)
        .filterRaw(scopeFilter(scope.kind))
    : q.star.filterByType('page_post').filterRaw(PUBLISHED_POST_FILTER);

  return q
    .parameters<{ scopeSlug?: string }>()
    .project((sub) => ({
      posts: posts
        .order('publishedAt desc')
        .slice(start, end)
        .project(postCardFragment)
        .notNull(true),
      total: sub.count(posts).notNull(true),
    }))
    .notNull(true);
}
