import { q } from '#/sanity/query';
import { postDetailFragment } from '#/shared/fragments/post';

export const postDetailQuery = q
  .parameters<{ slug: string }>()
  .star.filterByType('post')
  .filterRaw('slug.current == $slug')
  .slice(0)
  .project(postDetailFragment);
