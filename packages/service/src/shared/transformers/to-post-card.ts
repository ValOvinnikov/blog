import type { ISanityImage, TMaybeUndefined } from '@blog/config';
import type { postCardFragment } from '@blog/service/shared/fragments/post';
import { toPostHeading } from '@blog/service/shared/transformers/to-post-heading';
import { toSanityImage } from '@blog/service/shared/transformers/to-sanity-image';
import { toReadingTimeMinutes } from '@blog/utils';
import type { InferFragmentType } from 'groqd';

export type TRawPostCard = InferFragmentType<typeof postCardFragment>;

export type TPostCardAuthor = {
  id: string;
  name: string;
  profilePageSlug: TMaybeUndefined<string>;
  image: TMaybeUndefined<ISanityImage>;
};

export type TPostCardTopic = {
  id: string;
  title: string;
  slug: string;
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

function toPostCardAuthor(raw: TRawPostCard['author']): TPostCardAuthor {
  return {
    id: raw._id,
    name: raw.name,
    profilePageSlug: raw.profilePage?.slug ?? undefined,
    image: toSanityImage(raw.image),
  };
}

export function toPostCardTopic(raw: TRawPostCard['topic']): TPostCardTopic {
  return {
    id: raw._id,
    title: raw.title,
    slug: raw.slug,
  };
}

export function toPostCard(raw: TRawPostCard): TPostCard {
  const { title, excerpt } = toPostHeading(raw.headingBlock);

  return {
    id: raw._id,
    title,
    slug: raw.slug,
    excerpt,
    publishedAt: raw.publishedAt,
    heroImage: toSanityImage(raw.heroImage),
    featured: raw.featured ?? false,
    author: toPostCardAuthor(raw.author),
    topic: toPostCardTopic(raw.topic),
    readingTimeMinutes: toReadingTimeMinutes(raw.wordCount),
  };
}
