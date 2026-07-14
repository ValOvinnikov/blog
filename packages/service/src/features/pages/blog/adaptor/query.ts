import { q } from '@blog/service/sanity/query';
import { postCardFragment } from '@blog/service/shared/fragments/post';

const blogPosts = q.star.filterByType('blog_post').order('publishedAt desc');

// groqd's `.slice` takes literal indices (GROQ has no $param slices), so the
// window query is a builder, not a module-level const.
export const buildBlogListQuery = (start: number, end: number) =>
  blogPosts.slice(start, end).project(postCardFragment);

export const blogPostsCountQuery = q.count(blogPosts);
