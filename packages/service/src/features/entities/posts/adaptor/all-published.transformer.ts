import type { feedPostFragment } from '@blog/service/shared/fragments/feed-post';
import type { InferFragmentType } from 'groqd';

export type TRawFeedPost = InferFragmentType<typeof feedPostFragment>;

export type TFeedPost = {
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
};

function toFeedPost(raw: TRawFeedPost): TFeedPost {
  return {
    title: raw.title,
    slug: raw.slug,
    excerpt: raw.excerpt,
    publishedAt: raw.publishedAt,
  };
}

export function toAllPublishedPosts(raw: TRawFeedPost[]): TFeedPost[] {
  return raw.map(toFeedPost);
}
