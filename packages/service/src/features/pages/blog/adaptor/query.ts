import { q } from '@blog/service/sanity/query';
import { postCardFragment } from '@blog/service/shared/fragments/post';

export const blogListQuery = q.star
  .filterByType('blog_post')
  .order('publishedAt desc')
  .project(postCardFragment);
