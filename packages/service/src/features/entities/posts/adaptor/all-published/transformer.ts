import type { TMaybeUndefined } from '@blog/config';
import type { postFeedFragment } from '@blog/service/shared/fragments/post-feed';
import { toPostHeading } from '@blog/service/shared/transformers/to-post-heading';
import type { InferFragmentType } from 'groqd';

export type TRawFeedPost = InferFragmentType<typeof postFeedFragment>;

export type TFeedPost = {
  title: string;
  slug: string;
  excerpt: TMaybeUndefined<string>;
  publishedAt: string;
};

function toFeedPost(raw: TRawFeedPost): TFeedPost {
  const { title, excerpt } = toPostHeading(raw.headingBlock);

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
