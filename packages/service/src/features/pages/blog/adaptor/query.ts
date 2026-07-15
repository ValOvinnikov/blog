import { q } from '@blog/service/sanity/query';
import { postCardFragment } from '@blog/service/shared/fragments/post';

const blogPosts = q.star.filterByType('blog_post');

export const buildBlogPageQuery = (start: number, end: number) =>
  q.project((sub) => ({
    posts: blogPosts
      .order('publishedAt desc')
      .slice(start, end)
      .project(postCardFragment),
    total: sub.count(blogPosts),
  }));

/** Count-only query for `generateStaticParams` — no post projection or derefs. */
export const blogPageCountQuery = q.count(blogPosts);
