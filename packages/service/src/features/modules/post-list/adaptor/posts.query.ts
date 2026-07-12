import { q } from '#/sanity/query';
import { postCardFragment } from '#/shared/fragments/post';

export const postListModulePostsQuery = q.star
  .filterByType('post')
  .order('publishedAt desc')
  .project(postCardFragment);
