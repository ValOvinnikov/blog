import { POST_SOURCE } from '@blog/config';
import { toHeadingBlock } from '@blog/service/shared/transformers/heading-block/to-heading-block';
import { toLayout } from '@blog/service/shared/transformers/layout/to-layout';
import { toPostCard } from '@blog/service/shared/transformers/post/to-post-card';
import type { InferResultType } from 'groqd';

import type { postFeaturedModuleQuery } from './query';
import type { TPostFeaturedModule } from './types';

export type TRawPostFeaturedModule = InferResultType<
  typeof postFeaturedModuleQuery
>;

export function toPostFeaturedModule(
  raw: TRawPostFeaturedModule,
): TPostFeaturedModule {
  const posts = raw.posts ?? [];
  const limitedPosts =
    raw.postSource === POST_SOURCE.NEWEST_FEATURED && raw.limit != null
      ? posts.slice(0, raw.limit)
      : posts;

  return {
    brandVariant: raw.brandVariant,
    headingBlock: toHeadingBlock(raw.headingBlock),
    posts: limitedPosts.map((post) => toPostCard(post)),
    layout: toLayout(raw.layout),
    contentAlignment: raw.contentAlignment ?? undefined,
    showImages: raw.showImages,
    displayMode: raw.displayMode,
  };
}
