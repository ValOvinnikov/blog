import type { TMaybeUndefined } from '@blog/config';
import type { postFeedFragment } from '@blog/service/shared/fragments/post/post-feed';
import { toHeadingBlock } from '@blog/service/shared/transformers/heading-block/to-heading-block';
import type { InferFragmentType } from 'groqd';

export type TRawFeedPost = InferFragmentType<typeof postFeedFragment>;

export type TFeedPost = {
  title: string;
  slug: string;
  excerpt: TMaybeUndefined<string>;
  publishedAt: string;
};

function toFeedPost(raw: TRawFeedPost): TFeedPost {
  const { heading: title, supportingText: excerpt } = toHeadingBlock(
    raw.headingBlock,
  );

  return {
    title,
    slug: raw.slug,
    excerpt,
    publishedAt: raw.publishedAt,
  };
}

export function toAllPublishedPosts(raw: TRawFeedPost[]): TFeedPost[] {
  return raw.map(toFeedPost);
}
