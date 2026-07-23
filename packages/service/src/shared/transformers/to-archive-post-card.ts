import type { archivePostCardFragment } from '@blog/service/shared/fragments/archive-post-card';
import {
  toPostCardCategory,
  type TPostCardCategory,
} from '@blog/service/shared/transformers/to-post-card';
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
  categories: TPostCardCategory[];
};

export function toArchivePostCard(raw: TRawArchivePostCard): TArchivePostCard {
  return {
    id: raw._id,
    title: raw.title,
    slug: raw.slug,
    excerpt: raw.excerpt,
    publishedAt: raw.publishedAt,
    categories: raw.categories.map(toPostCardCategory),
  };
}
