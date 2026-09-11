import { POST_SOURCE } from '@blog/config';
import type { TImageTenant } from '@blog/service/sanity/image';
import { toHeadingBlock } from '@blog/service/shared/transformers/to-heading-block';
import { toLayout } from '@blog/service/shared/transformers/to-layout';
import { toPostCard } from '@blog/service/shared/transformers/to-post-card';
import type { InferResultType } from 'groqd';

import type { postFeaturedModuleQuery } from './query';
import type { TPostFeaturedModule } from './types';

export type TRawPostFeaturedModule = InferResultType<
  typeof postFeaturedModuleQuery
>;

export function toPostFeaturedModule(
  raw: TRawPostFeaturedModule,
  tenant: TImageTenant,
): TPostFeaturedModule {
  const posts = raw.posts ?? [];
  const limitedPosts =
    raw.postSource === POST_SOURCE.NEWEST_FEATURED && raw.limit != null
      ? posts.slice(0, raw.limit)
      : posts;

  return {
    brandVariant: raw.brandVariant,
    headingBlock: toHeadingBlock(raw.headingBlock),
    posts: limitedPosts.map((post) => toPostCard(post, tenant)),
    layout: toLayout(raw.layout),
    contentAlignment: raw.contentAlignment ?? undefined,
    showImages: raw.showImages,
    displayMode: raw.displayMode,
  };
}
