import { q } from '@blog/service/sanity/query';
import {
  FIRST_POST_LIST_PAGE_SIZE_EXPRESSION,
  firstPostListPageSizeParser,
} from '@blog/service/shared/expressions/module/first-post-list-page-size';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/expressions/post/published-post';

export const indexPageParamsQuery = q.star
  .filterByType('page_postIndex')
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
      firstPostListPageSizeParser,
    ),
  }))
  .notNull();
