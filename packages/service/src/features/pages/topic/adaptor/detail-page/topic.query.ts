import { q, type TSlugParams } from '@blog/service/sanity/query';
import { topicFragment } from '@blog/service/shared/fragments/topic';

export const topicPageTopicQuery = q
  .parameters<TSlugParams>()
  .star.filterByType('blog_topic')
  .filterBy('slug.current == $slug')
  .slice(0)
  .project(topicFragment);
