import { q } from '@blog/service/sanity/query';
import { tagWithPostCountFragment } from '@blog/service/shared/fragments/tag';

export const tagsQuery = q.star
  .filterByType('blog_tag')
  .order('title asc')
  .project(tagWithPostCountFragment);
