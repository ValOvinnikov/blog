import { q } from '@blog/service/sanity/query';

const blogPosts = q.star.filterByType('blog_post');
const pageBlog = q.star.filterByType('page_blog').slice(0);

/** Count + itemsPerPage for `generateStaticParams` — no post projection or derefs. */
export const indexPageParamsQuery = q.project((sub) => ({
  total: sub.count(blogPosts),
  itemsPerPage: pageBlog.field('itemsPerPage').nullable(true),
}));
