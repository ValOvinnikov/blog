import type { TBlogIndexSettings } from '@blog/service/features/pages/blog/adaptor/settings/types';
import { toPostCard } from '@blog/service/shared/transformers/to-post-card';
import { toTotalPages } from '@blog/utils';
import type { InferResultType } from 'groqd';

import type { buildIndexPageQuery } from './query';
import type { TBlogIndexPage } from './types';

export type TRawBlogIndexPage = InferResultType<
  ReturnType<typeof buildIndexPageQuery>
>;

export function toIndexPage(
  raw: TRawBlogIndexPage,
  settings: TBlogIndexSettings,
  currentPage: number,
  pageSize: number,
): TBlogIndexPage {
  return {
    heading: settings.heading,
    supportingText: settings.supportingText,
    seo: settings.seo,
    posts: raw.posts.map(toPostCard),
    currentPage,
    totalPages: toTotalPages(raw.total, pageSize),
    total: raw.total,
  };
}
