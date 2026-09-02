import type { TImageTenant } from '@blog/service/sanity/image';
import { toLayout } from '@blog/service/shared/transformers/to-layout';
import { toPostCard } from '@blog/service/shared/transformers/to-post-card';
import { toSectionHeader } from '@blog/service/shared/transformers/to-section-header';
import type { InferResultType } from 'groqd';

import type { postLatestModulePostsQuery } from './posts.query';
import type { postLatestModuleQuery } from './query';
import type { TPostLatestModule } from './types';

export type TRawPostLatestModule = InferResultType<
  typeof postLatestModuleQuery
>;
export type TRawPostLatestModulePosts = InferResultType<
  ReturnType<typeof postLatestModulePostsQuery>
>;

export function toPostLatestModule(
  raw: TRawPostLatestModule,
  rawPosts: TRawPostLatestModulePosts,
  tenant: TImageTenant,
): TPostLatestModule {
  return {
    brandVariant: raw.brandVariant,
    sectionHeader: raw.sectionHeader
      ? toSectionHeader(raw.sectionHeader)
      : { heading: undefined, supportingText: undefined, align: undefined },
    posts: rawPosts.map((rawPost) => toPostCard(rawPost, tenant)),
    layout: toLayout(raw.layout),
  };
}
