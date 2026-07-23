import { isr, runQuery } from '@blog/service/sanity/query';

import { categoriesQuery } from './query';
import { toCategories } from './transformer';
import type { TCategoriesList } from './types';

/** Every category with its title/slug/description and published-post count, alphabetical by title. */
export async function getCategories(): Promise<TCategoriesList> {
  const raw = await runQuery(categoriesQuery, isr(['categories', 'posts']));
  return toCategories(raw);
}
