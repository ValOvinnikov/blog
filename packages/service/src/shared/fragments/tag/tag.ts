import { q } from '@blog/service/sanity/query/query';
import {
  POST_COUNT_EXPRESSION,
  postCountParser,
} from '@blog/service/shared/expressions/post/post-count';
import { tagArchivePageSlugFragment } from '@blog/service/shared/fragments/archive-page/archive-page-slug';
import { getLocalizedField } from '@blog/service/shared/localization/get-localized-field/get-localized-field';
import type { TLocaleQueryParams } from '@blog/service/shared/localization/locale-query-params/locale-query-params';

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
