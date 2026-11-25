import { POST_SOURCE } from '@shinefold/config';
import { toModuleHeadingBlock } from '@shinefold/service/shared/transformers/heading-block/to-module-heading-block';
import { toLayout } from '@shinefold/service/shared/transformers/layout/to-layout';
import { toModuleAppearance } from '@shinefold/service/shared/transformers/module/to-module-appearance';
import { toPostCard } from '@shinefold/service/shared/transformers/post/to-post-card';
import type { InferResultType } from 'groqd';

import type { postFeaturedModuleQuery } from './query';
import type { TPostFeaturedModule } from './types';

export type TRawPostFeaturedModule = InferResultType<
  typeof postFeaturedModuleQuery
>;

export function toPostFeaturedModule(
  raw: TRawPostFeaturedModule,
): TPostFeaturedModule {
  const posts = (raw.posts ?? []).flatMap(({ post }) => (post ? [post] : []));
  const limitedPosts =
    raw.postSource === POST_SOURCE.NEWEST_FEATURED && raw.limit != null
      ? posts.slice(0, raw.limit)
      : posts;

  return {
    brandVariant: raw.brandVariant,
    headingBlock: toModuleHeadingBlock(raw.headingBlock),
    posts: limitedPosts.map((post) => toPostCard(post)),
    layout: toLayout(raw.layout),
    contentAlignment: raw.contentAlignment ?? undefined,
    showImages: raw.showImages,
    displayMode: raw.displayMode,
    ...toModuleAppearance(raw),
  };
}
