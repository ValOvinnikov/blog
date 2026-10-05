import { q } from '@blog/service/sanity/query';
import {
  FIRST_POST_LIST_PAGE_SIZE_EXPRESSION,
  firstPostListPageSizeParser,
} from '@blog/service/shared/expressions/module/first-post-list-page-size';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/expressions/post/published-post';

export const topicPaginationParamsQuery = q.star
  .filterByType('page_topic')
  .project((sub) => ({
    slug: sub.field('slug.current').notNull(),
    pageSize: sub.raw(
      FIRST_POST_LIST_PAGE_SIZE_EXPRESSION,
      firstPostListPageSizeParser,
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
