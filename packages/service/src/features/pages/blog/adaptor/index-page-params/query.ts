import { q } from '@blog/service/sanity/query';
import {
  POST_CONTENT_READY_FILTER,
  PUBLISHED_POST_FILTER,
} from '@blog/service/shared/filters/published-post';

export const indexPageParamsQuery = q.star
  .filterByType('page_blog')
  .slice(0)
  .project((page) => ({
    blogPosts: q.project((sub) => ({
      total: sub
        .count(
          q.star
            .filterByType('page_post')
            .filterRaw(PUBLISHED_POST_FILTER)
            .filterRaw(POST_CONTENT_READY_FILTER),
        )
        .notNull(true),
    })),
    postList: page
      .field('postList')
      .deref()
      .project((archive) => ({
        pageSize: archive.field('pageSize').notNull(),
      }))
      .nullable(true),
  }))
  .notNull();
