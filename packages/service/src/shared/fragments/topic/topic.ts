import { q } from '@blog/service/sanity/query';
import {
  POST_COUNT_EXPRESSION,
  postCountParser,
} from '@blog/service/shared/expressions/post-count';

export const topicFragment = q
  .fragmentForType<'blog_topic'>()
  .project((sub) => ({
    _id: true,
    title: sub.field('title').notNull(),
    slug: sub.field('slug.current').notNull(),
    description: sub.field('description').nullable(true),
  }));

export const topicWithPostCountFragment = q
  .fragmentForType<'blog_topic'>()
  .project((sub) => ({
    ...topicFragment,
    postCount: sub.raw(POST_COUNT_EXPRESSION, postCountParser),
  }));
