import { q } from '@blog/service/sanity/query';
import {
  POST_COUNT_EXPRESSION,
  postCountParser,
} from '@blog/service/shared/fragments/post-count';
import { topicFragment } from '@blog/service/shared/fragments/topic';

export const topicsQuery = q.star
  .filterByType('blog_topic')
  .order('title asc')
  .project((sub) => ({
    ...topicFragment,
    postCount: sub.raw(POST_COUNT_EXPRESSION, postCountParser),
  }));
