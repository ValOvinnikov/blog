import type { TMaybeUndefined } from '@blog/config';
import type { feedPostFragment } from '@blog/service/shared/fragments/feed-post';
import { toPostHeading } from '@blog/service/shared/transformers/to-post-heading';
import type { InferFragmentType } from 'groqd';

export type TRawFeedPost = InferFragmentType<typeof feedPostFragment>;

export type TFeedPost = {
  title: TMaybeUndefined<string>;
  slug: string;
  excerpt: TMaybeUndefined<string>;
  publishedAt: string;
};

function toFeedPost(raw: TRawFeedPost): TFeedPost {
  const { title, excerpt } = toPostHeading(raw.sectionHeader);

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
