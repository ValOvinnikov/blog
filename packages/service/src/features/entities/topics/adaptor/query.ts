import { q } from '@blog/service/sanity/query/query';
import { topicWithPostCountFragment } from '@blog/service/shared/fragments/topic/topic';

export const topicsQuery = q.star
  .filterByType('blog_topic')
  .project(topicWithPostCountFragment)
  .order('title asc');
