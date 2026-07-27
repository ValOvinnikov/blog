import { q } from '@blog/service/sanity/query';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/filters/published-post';

export const indexPageParamsQuery = q.star
  .filterByType('page_blog')
  .slice(0)
  .project((page) => ({
    blogPosts: q.project((sub) => ({
      total: sub
        .count(
          q.star.filterByType('blog_post').filterRaw(PUBLISHED_POST_FILTER),
        )
        .notNull(true),
    })),
    itemsPerPage: page.field('itemsPerPage').notNull(),
  }))
  .notNull();
