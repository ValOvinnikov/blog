import { q } from '#/sanity/query';
import { authorDetailFragment } from '#/shared/fragments/author';

export const authorQuery = q
  .parameters<{ slug: string }>()
  .star.filterByType('author')
  .filterRaw('slug.current == $slug')
  .slice(0)
  .project(authorDetailFragment);
