import type { ISanityImage, TMaybeUndefined } from '@blog/config';
import type { postCardFragment } from '@blog/service/shared/fragments/post/post';
import { toHeadingBlock } from '@blog/service/shared/transformers/heading-block/to-heading-block';
import { toSanityImage } from '@blog/service/shared/transformers/image/to-sanity-image';
import {
  toPersonCard,
  type TPersonCard,
} from '@blog/service/shared/transformers/person/to-person-card';
import { toReadingTimeMinutes } from '@blog/utils';
import type { InferFragmentType } from 'groqd';

export type TRawPostCard = InferFragmentType<typeof postCardFragment>;

export type TPostCardAuthor = TPersonCard;

export type TPostCardTopic = {
  id: string;
  title: string;
  slug: TMaybeUndefined<string>;
};

export type TPostCard = {
  id: string;
  title: string;
  slug: string;
  excerpt: TMaybeUndefined<string>;
  publishedAt: string;
  heroImage: TMaybeUndefined<ISanityImage>;
  featured: boolean;
  author: TPostCardAuthor;
  topic: TPostCardTopic;
  readingTimeMinutes: number;
};

function toPostCardTopic(raw: TRawPostCard['topic']): TPostCardTopic {
  return {
    id: raw._id,
    title: raw.title,
    slug: raw.slug ?? undefined,
  };
}

export function toPostCard(raw: TRawPostCard): TPostCard {
  const { heading: title, supportingText: excerpt } = toHeadingBlock(
    raw.headingBlock,
  );

  return {
    id: raw._id,
    title,
    slug: raw.slug,
    excerpt,
    publishedAt: raw.publishedAt,
    heroImage: toSanityImage(raw.heroImage),
    featured: raw.featured ?? false,
    author: toPersonCard(raw.author),
    topic: toPostCardTopic(raw.topic),
    readingTimeMinutes: toReadingTimeMinutes(raw.wordCount),
  };
}
