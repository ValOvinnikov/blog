import { isr, runQuery } from '@blog/service/sanity/query';

import { categoriesQuery } from './query';
import { toCategories } from './transformer';
import type { TCategoriesList } from './types';

export async function getCategories(): Promise<TCategoriesList> {
  const raw = await runQuery(categoriesQuery, isr('categories'));
  return toCategories(raw);
}
