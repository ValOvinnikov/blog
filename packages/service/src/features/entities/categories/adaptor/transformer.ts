import { toCategory } from '@blog/service/shared/transformers/to-category';
import type { InferResultType } from 'groqd';

import type { categoriesQuery } from './query';
import type { TCategoriesList } from './types';

export function toCategories(
  raw: InferResultType<typeof categoriesQuery>,
): TCategoriesList {
  return raw.map(toCategory);
}
