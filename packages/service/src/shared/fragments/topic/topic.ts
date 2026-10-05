import { q } from '@blog/service/sanity/query/query';
import {
  TOPIC_ARCHIVE_PAGE_SLUG_EXPRESSION,
  archivePageSlugParser,
} from '@blog/service/shared/expressions/archive-page/archive-page-slug';
import {
  POST_COUNT_EXPRESSION,
  postCountParser,
} from '@blog/service/shared/expressions/post/post-count';

export const topicFragment = q
  .fragmentForType<'blog_topic'>()
  .project((sub) => ({
    _id: true,
    title: sub.field('title').notNull(),
    slug: sub.raw(TOPIC_ARCHIVE_PAGE_SLUG_EXPRESSION, archivePageSlugParser),
    description: sub.field('description').nullable(true),
  }));

export const topicWithPostCountFragment = q
  .fragmentForType<'blog_topic'>()
  .project((sub) => ({
    ...topicFragment,
    postCount: sub.raw(POST_COUNT_EXPRESSION, postCountParser),
  }));
