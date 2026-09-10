import { q } from '@blog/service/sanity/query';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/filters/published-post';
import { z } from 'zod';

const FIRST_POST_LIST_PAGE_SIZE_EXPRESSION =
  'modules[]->[_type == "module_postList"][0].pageSize';

export const indexPageParamsQuery = q.star
  .filterByType('page_blog')
  .slice(0)
  .project((page) => ({
    blogPosts: q.project((sub) => ({
      total: sub
        .count(
          q.star.filterByType('page_post').filterRaw(PUBLISHED_POST_FILTER),
        )
        .notNull(true),
    })),
    pageSize: page.raw(
      FIRST_POST_LIST_PAGE_SIZE_EXPRESSION,
      z.number().nullable(),
    ),
  }))
  .notNull();
