import { q } from '@shinefold/service/sanity/query/query';
import {
  POST_COUNT_EXPRESSION,
  postCountParser,
} from '@shinefold/service/shared/expressions/post/post-count';
import { tagArchivePageSlugFragment } from '@shinefold/service/shared/fragments/archive-page/archive-page-slug';
import { getLocalizedField } from '@shinefold/service/shared/localization/get-localized-field/get-localized-field';
import type { TLocaleQueryParams } from '@shinefold/service/shared/localization/locale-query-params/locale-query-params';

const localeQ = q.parameters<TLocaleQueryParams>();

export const tagFragment = localeQ
  .fragmentForType<'blog_tag'>()
  .project((sub) => ({
    _id: true,
    title: getLocalizedField(sub, 'title').notNull(),
    slug: tagArchivePageSlugFragment,
  }));

export const tagWithPostCountFragment = localeQ
  .fragmentForType<'blog_tag'>()
  .project((sub) => ({
    ...tagFragment,
    description: getLocalizedField(sub, 'description'),
    postCount: sub.raw(POST_COUNT_EXPRESSION, postCountParser),
  }));
