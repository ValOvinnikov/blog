import type { InferResultType } from 'groqd';

import { toCategory } from '#/shared/transformers/to-category';

import type { categoriesQuery } from './query';
import type { TCategoriesList } from './types';

export function toCategories(
  raw: InferResultType<typeof categoriesQuery>
): TCategoriesList {
  return raw.map(toCategory);
}
