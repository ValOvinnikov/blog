import type { postLinkFragment } from '@blog/service/shared/fragments/post-link';
import type { InferFragmentType } from 'groqd';

export type TRawPostLink = InferFragmentType<typeof postLinkFragment>;

export type TPostLink = {
  id: string;
  title: string;
  slug: string;
};

export function toPostLink(raw: TRawPostLink): TPostLink {
  return {
    id: raw._id,
    title: raw.headingBlock.heading,
    slug: raw.slug,
  };
}
