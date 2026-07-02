import type { InferFragmentType } from 'groqd';

import type { categoryFragment } from '#/shared/fragments/category';

export type TRawCategory = InferFragmentType<typeof categoryFragment>;

export type TCategory = {
  id: string;
  title: string;
  slug: string;
  description: string | undefined;
};

export function toCategory(raw: TRawCategory): TCategory {
  return {
    id: raw._id,
    title: raw.title,
    slug: raw.slug,
    description: raw.description ?? undefined,
  };
}
