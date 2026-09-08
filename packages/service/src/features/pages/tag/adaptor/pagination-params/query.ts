import { q } from '@blog/service/sanity/query';
import {
  POST_CONTENT_READY_FILTER,
  PUBLISHED_POST_FILTER,
} from '@blog/service/shared/filters/published-post';

// `^.tag._ref` (GROQ's parent-scope operator) correlates each `page_post`
// back to the enclosing `page_tag` document's own tag reference within this
// per-item projection — one round-trip for every tag page's slug, post
// count, and archive page size, no per-slug fan-out. `references()` matches
// a tag reference anywhere in the document, including inside `page_post`'s
// `tags[]` array, so matching by reference identity (not slug) stays correct
// even if `page_tag.slug` (independently editable) drifts from the
// referenced tag's slug.
export const tagPaginationParamsQuery = q.star
  .filterByType('page_tag')
  .project((sub) => ({
    slug: sub.field('slug.current').notNull(),
    postList: sub
      .field('postList')
      .deref()
      .project((archive) => ({
        pageSize: archive.field('pageSize').notNull(),
      }))
      .nullable(true),
    postCount: sub
      .count(
        sub.star
          .filterByType('page_post')
          .filterRaw('references(^.tag._ref)')
          .filterRaw(PUBLISHED_POST_FILTER)
          .filterRaw(POST_CONTENT_READY_FILTER),
      )
      .notNull(true),
  }));
