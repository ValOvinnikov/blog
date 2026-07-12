import { q } from '@blog/service/sanity/query';
import { postDetailFragment } from '@blog/service/shared/fragments/post';

export const postDetailQuery = q
  .parameters<{ slug: string }>()
  .star.filterByType('blog_post')
  .filterRaw('slug.current == $slug')
  .slice(0)
  .project(postDetailFragment);
