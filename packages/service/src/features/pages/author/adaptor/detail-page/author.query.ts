import { q, type TSlugParams } from '@blog/service/sanity/query';
import { authorDetailFragment } from '@blog/service/shared/fragments/author';

export const authorPageAuthorQuery = q
  .parameters<TSlugParams>()
  .star.filterByType('blog_author')
  .filterBy('slug.current == $slug')
  .slice(0)
  .project(authorDetailFragment);
