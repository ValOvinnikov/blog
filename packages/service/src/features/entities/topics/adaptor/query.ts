import { q } from '@blog/service/sanity/query';
import { topicWithPostCountFragment } from '@blog/service/shared/fragments/topic';

export const topicsQuery = q.star
  .filterByType('blog_topic')
  .order('title asc')
  .project(topicWithPostCountFragment);
