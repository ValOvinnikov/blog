import { q } from '@shinefold/service/sanity/query/query';
import { topicWithPostCountFragment } from '@shinefold/service/shared/fragments/topic/topic';

export const topicsQuery = q.star
  .filterByType('blog_topic')
  .project(topicWithPostCountFragment)
  .order('title asc');
