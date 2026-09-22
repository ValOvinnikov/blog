import { q } from '@blog/service/sanity/query';
import {
  POST_COUNT_EXPRESSION,
  postCountParser,
} from '@blog/service/shared/fragments/post-count';

export const tagFragment = q.fragmentForType<'blog_tag'>().project((sub) => ({
  _id: true,
  title: sub.field('title').notNull(),
  slug: sub.field('slug.current').notNull(),
}));

export const tagWithPostCountFragment = q
  .fragmentForType<'blog_tag'>()
  .project((sub) => ({
    ...tagFragment,
    description: sub.field('description').nullable(true),
    postCount: sub.raw(POST_COUNT_EXPRESSION, postCountParser),
  }));
