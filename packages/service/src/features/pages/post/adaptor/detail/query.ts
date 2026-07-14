import { q, type TSlugParams } from '@blog/service/sanity/query';
import { postDetailFragment } from '@blog/service/shared/fragments/post';

export const postDetailQuery = q
  .parameters<TSlugParams>()
  .star.filterByType('blog_post')
  .filterBy('slug.current == $slug')
  .slice(0)
  .project(postDetailFragment);
