import type { tagFragment } from '@blog/service/shared/fragments/tag';
import type { InferFragmentType } from 'groqd';

export type TRawTag = InferFragmentType<typeof tagFragment>;

export type TTag = {
  id: string;
  title: string;
  slug: string;
};

export function toTag(raw: TRawTag): TTag {
  return {
    id: raw._id,
    title: raw.title,
    slug: raw.slug,
  };
}
