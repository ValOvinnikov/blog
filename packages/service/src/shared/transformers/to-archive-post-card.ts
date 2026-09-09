import type { TMaybeUndefined } from '@blog/config';
import type { archivePostCardFragment } from '@blog/service/shared/fragments/archive-post-card';
import {
  toPostCardTopic,
  type TPostCardTopic,
} from '@blog/service/shared/transformers/to-post-card';
import { toPostHeading } from '@blog/service/shared/transformers/to-post-heading';
import { toReadingTimeMinutes } from '@blog/utils';
import type { InferFragmentType } from 'groqd';

export type TRawArchivePostCard = InferFragmentType<
  typeof archivePostCardFragment
>;

export type TArchivePostCard = {
  id: string;
  title: TMaybeUndefined<string>;
  slug: string;
  excerpt: TMaybeUndefined<string>;
  publishedAt: string;
  topic: TMaybeUndefined<TPostCardTopic>;
  readingTimeMinutes: number;
};

export function toArchivePostCard(raw: TRawArchivePostCard): TArchivePostCard {
  const { title, excerpt } = toPostHeading(raw.sectionHeader);

  return {
    id: raw._id,
    title,
    slug: raw.slug,
    excerpt,
    publishedAt: raw.publishedAt,
    topic: raw.topic ? toPostCardTopic(raw.topic) : undefined,
    readingTimeMinutes: toReadingTimeMinutes(raw.wordCount),
  };
}
