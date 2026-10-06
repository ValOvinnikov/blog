import { q } from '@blog/service/sanity/query/query';
import { tagWithPostCountFragment } from '@blog/service/shared/fragments/tag/tag';

export const tagsQuery = q.star
  .filterByType('blog_tag')
  .project(tagWithPostCountFragment)
  .order('title asc');
