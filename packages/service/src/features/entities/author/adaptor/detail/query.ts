import { q } from '@blog/service/sanity/query';
import { authorDetailFragment } from '@blog/service/shared/fragments/author';

export const authorQuery = q
  .parameters<{ slug: string }>()
  .star.filterByType('blog_author')
  .filterRaw('slug.current == $slug')
  .slice(0)
  .project(authorDetailFragment);
