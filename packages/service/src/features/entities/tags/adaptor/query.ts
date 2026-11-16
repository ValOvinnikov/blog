import { q } from '@shinefold/service/sanity/query/query';
import { tagWithPostCountFragment } from '@shinefold/service/shared/fragments/tag/tag';

export const tagsQuery = q.star
  .filterByType('blog_tag')
  .project(tagWithPostCountFragment)
  .order('title asc');
