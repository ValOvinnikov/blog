import { q } from '@blog/service/sanity/query';

export const indexPageParamsQuery = q.star
  .filterByType('page_blog')
  .slice(0)
  .project((page) => ({
    blogPosts: q.project((sub) => ({
      total: sub.count(q.star.filterByType('blog_post')).notNull(true),
    })),
    itemsPerPage: page.field('itemsPerPage').notNull(),
  }))
  .notNull();
