import type { InferResultType } from 'groqd';
import type { TCategory } from '#/shared/types';
import { categoriesQuery } from './query';

type TRawCategories = InferResultType<typeof categoriesQuery>;

export type TCategoriesList = TCategory[];

export function toCategories(raw: TRawCategories): TCategoriesList {
  return raw.map((item) => ({
    id: item._id,
    title: item.title ?? '',
    slug: item.slug ?? '',
    description: item.description ?? null,
  }));
}
