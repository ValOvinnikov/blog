import type { TImageTenant } from '@blog/service/sanity/image';
import { toLayout } from '@blog/service/shared/transformers/to-layout';
import { toPostCard } from '@blog/service/shared/transformers/to-post-card';
import { toSectionHeader } from '@blog/service/shared/transformers/to-section-header';
import type { InferResultType } from 'groqd';

import type { postListModulePaginatedPostsQuery } from './posts.query';
import type { postListModuleQuery } from './query';
import type { TPostListModule } from './types';

export type TRawPostListModule = InferResultType<typeof postListModuleQuery>;
export type TRawPostListModulePosts = InferResultType<
  ReturnType<typeof postListModulePaginatedPostsQuery>
>['posts'];

export type TPostListModulePagination = {
  currentPage: number;
  totalPages: number;
};

export function toPostListModule(
  raw: TRawPostListModule,
  rawPosts: TRawPostListModulePosts,
  pagination: TPostListModulePagination,
  tenant: TImageTenant,
): TPostListModule {
  return {
    brandVariant: raw.brandVariant,
    sectionHeader: raw.sectionHeader
      ? toSectionHeader(raw.sectionHeader)
      : { heading: undefined, supportingText: undefined, align: undefined },
    posts: rawPosts.map((rawPost) => toPostCard(rawPost, tenant)),
    layout: toLayout(raw.layout),
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
  };
}
