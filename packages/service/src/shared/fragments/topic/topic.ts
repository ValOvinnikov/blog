import { q } from '@shinefold/service/sanity/query/query';
import {
  POST_COUNT_EXPRESSION,
  postCountParser,
} from '@shinefold/service/shared/expressions/post/post-count';
import { topicArchivePageSlugFragment } from '@shinefold/service/shared/fragments/archive-page/archive-page-slug';
import { getLocalizedField } from '@shinefold/service/shared/localization/get-localized-field/get-localized-field';
import type { TLocaleQueryParams } from '@shinefold/service/shared/localization/locale-query-params/locale-query-params';

const localeQ = q.parameters<TLocaleQueryParams>();

export const topicFragment = localeQ
  .fragmentForType<'blog_topic'>()
  .project((sub) => ({
    _id: true,
    title: getLocalizedField(sub, 'title').notNull(),
    slug: topicArchivePageSlugFragment,
    description: getLocalizedField(sub, 'description'),
  }));

export const topicWithPostCountFragment = localeQ
  .fragmentForType<'blog_topic'>()
  .project((sub) => ({
    ...topicFragment,
    postCount: sub.raw(POST_COUNT_EXPRESSION, postCountParser),
  }));
