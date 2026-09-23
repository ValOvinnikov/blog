import { TAXONOMY_KIND, type TTaxonomyKind } from '@blog/config';
import { q } from '@blog/service/sanity/query';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/expressions/published-post';
import { postCardFragment } from '@blog/service/shared/fragments/post/post';

export type TPostListScope = {
  kind: TTaxonomyKind;
  slug: string;
};

const SCOPE_ARCHIVE_PAGE: Record<
  TTaxonomyKind,
  { pageType: string; referenceField: string }
> = {
  [TAXONOMY_KIND.TAGS]: { pageType: 'page_tag', referenceField: 'tag' },
  [TAXONOMY_KIND.TOPICS]: { pageType: 'page_topic', referenceField: 'topic' },
};

// $scopeSlug is the archive page's own slug (from the route), not the
// referenced term's slug — the two are independently editable and can
// drift. Resolving the archive page by $scopeSlug first and then following
// its reference field to the term keeps this correct even when they do.
function scopeFilter(kind: TTaxonomyKind) {
  const { pageType, referenceField } = SCOPE_ARCHIVE_PAGE[kind];
  return `references(*[_type == "${pageType}" && slug.current == $scopeSlug][0].${referenceField}._ref)`;
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
