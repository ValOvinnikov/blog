import { q } from '@blog/service/sanity/query';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/filters/published-post';
import { z } from 'zod';

const FIRST_POST_LIST_PAGE_SIZE_EXPRESSION =
  'modules[]->[_type == "module_postList"][0].pageSize';

// `^.topic._ref` (GROQ's parent-scope operator) correlates each `page_post`
// back to the enclosing `page_topic` document's own topic reference within
// this per-item projection — one round-trip for every topic page's slug,
// post count, and archive page size, no per-slug fan-out. Matching by
// reference identity (`references(...)`), not slug, avoids reading the
// deprecated `blog_topic.slug` and stays correct even if `page_topic.slug`
// (independently editable) drifts from the referenced topic's slug.
export const topicPaginationParamsQuery = q.star
  .filterByType('page_topic')
  .project((sub) => ({
    slug: sub.field('slug.current').notNull(),
    pageSize: sub.raw(
      FIRST_POST_LIST_PAGE_SIZE_EXPRESSION,
      z.number().nullable(),
    ),
    postCount: sub
      .count(
        sub.star
          .filterByType('page_post')
          .filterRaw('references(^.topic._ref)')
          .filterRaw(PUBLISHED_POST_FILTER),
      )
      .notNull(true),
  }));
