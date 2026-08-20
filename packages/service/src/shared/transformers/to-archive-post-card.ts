import type { archivePostCardFragment } from '@blog/service/shared/fragments/archive-post-card';
import {
  toPostCardTopic,
  type TPostCardTopic,
} from '@blog/service/shared/transformers/to-post-card';
import { toReadingTimeMinutes } from '@blog/utils';
import type { InferFragmentType } from 'groqd';

export type TRawArchivePostCard = InferFragmentType<
  typeof archivePostCardFragment
>;

export type TArchivePostCard = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
  topic: TPostCardTopic;
  readingTimeMinutes: number;
};

export function toArchivePostCard(raw: TRawArchivePostCard): TArchivePostCard {
  return {
    id: raw._id,
    title: raw.title,
    slug: raw.slug,
    excerpt: raw.excerpt,
    publishedAt: raw.publishedAt,
    topic: toPostCardTopic(raw.topic),
    readingTimeMinutes: toReadingTimeMinutes(raw.wordCount),
  };
}
