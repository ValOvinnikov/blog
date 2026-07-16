import type { TMaybeUndefined } from '@blog/config';
import type { categoryFragment } from '@blog/service/shared/fragments/category';
import type { InferFragmentType } from 'groqd';

export type TRawCategory = InferFragmentType<typeof categoryFragment>;

export type TCategory = {
  id: string;
  title: string;
  slug: string;
  description: TMaybeUndefined<string>;
};

export function toCategory(raw: TRawCategory): TCategory {
  return {
    id: raw._id,
    title: raw.title,
    slug: raw.slug,
    description: raw.description ?? undefined,
  };
}
