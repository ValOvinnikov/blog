import { q } from '#/sanity/query';
import { postCardFragment } from '#/shared/fragments/post';

export const blogListQuery = q.star
  .filterByType('blog_post')
  .order('publishedAt desc')
  .project(postCardFragment);
