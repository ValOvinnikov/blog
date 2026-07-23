import { toCategory } from '@blog/service/shared/transformers/to-category';
import type { InferResultType } from 'groqd';

import type { categoriesQuery } from './query';
import type { TCategoriesList, TCategoryWithPostCount } from './types';

export type TRawCategoryWithPostCount = InferResultType<
  typeof categoriesQuery
>[number];

function toCategoryWithPostCount(
  raw: TRawCategoryWithPostCount,
): TCategoryWithPostCount {
  return {
    ...toCategory(raw),
    postCount: raw.postCount,
  };
}

export function toCategories(
  raw: InferResultType<typeof categoriesQuery>,
): TCategoriesList {
  return raw.map(toCategoryWithPostCount);
}
