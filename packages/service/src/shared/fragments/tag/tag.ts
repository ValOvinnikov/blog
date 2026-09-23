import { q } from '@blog/service/sanity/query';
import {
  archivePageSlugParser,
  buildArchivePageSlugExpression,
} from '@blog/service/shared/expressions/archive-page-slug';
import {
  POST_COUNT_EXPRESSION,
  postCountParser,
} from '@blog/service/shared/expressions/post-count';

const ARCHIVE_PAGE_SLUG_EXPRESSION = buildArchivePageSlugExpression(
  'page_tag',
  'tag',
);

export const tagFragment = q.fragmentForType<'blog_tag'>().project((sub) => ({
  _id: true,
  title: sub.field('title').notNull(),
  slug: sub.raw(ARCHIVE_PAGE_SLUG_EXPRESSION, archivePageSlugParser),
}));

export const tagWithPostCountFragment = q
  .fragmentForType<'blog_tag'>()
  .project((sub) => ({
    ...tagFragment,
    description: sub.field('description').nullable(true),
    postCount: sub.raw(POST_COUNT_EXPRESSION, postCountParser),
  }));
