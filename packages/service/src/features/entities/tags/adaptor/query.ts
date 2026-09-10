import { q } from '@blog/service/sanity/query';
import {
  POST_COUNT_EXPRESSION,
  postCountParser,
} from '@blog/service/shared/fragments/post-count';
import { tagFragment } from '@blog/service/shared/fragments/tag';

export const tagsQuery = q.star
  .filterByType('blog_tag')
  .order('title asc')
  .project((sub) => ({
    ...tagFragment,
    description: sub.field('description').nullable(true),
    postCount: sub.raw(POST_COUNT_EXPRESSION, postCountParser),
  }));
