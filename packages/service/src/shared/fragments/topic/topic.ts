import { q } from '@blog/service/sanity/query/query';
import {
  TOPIC_ARCHIVE_PAGE_SLUG_EXPRESSION,
  archivePageSlugParser,
} from '@blog/service/shared/expressions/archive-page/archive-page-slug';
import {
  POST_COUNT_EXPRESSION,
  postCountParser,
} from '@blog/service/shared/expressions/post/post-count';
import { getLocalizedField } from '@blog/service/shared/localization/get-localized-field/get-localized-field';
import type { TLocaleParams } from '@blog/service/shared/localization/locale-params/locale-params';

const localeQ = q.parameters<TLocaleParams>();

export const topicFragment = localeQ
  .fragmentForType<'blog_topic'>()
  .project((sub) => ({
    _id: true,
    title: getLocalizedField(sub, 'title').notNull(),
    slug: sub.raw(TOPIC_ARCHIVE_PAGE_SLUG_EXPRESSION, archivePageSlugParser),
    description: getLocalizedField(sub, 'description'),
  }));

export const topicWithPostCountFragment = localeQ
  .fragmentForType<'blog_topic'>()
  .project((sub) => ({
    ...topicFragment,
    postCount: sub.raw(POST_COUNT_EXPRESSION, postCountParser),
  }));
