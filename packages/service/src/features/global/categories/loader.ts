import { runQuery, isr } from '#/sanity/query';
import { categoriesQuery } from './query';
import { toCategories } from './transformer';
import type { TCategoriesList } from './transformer';

export type { TCategoriesList };

export async function getCategories(): Promise<TCategoriesList> {
  const raw = await runQuery(categoriesQuery, isr('categories'));
  return toCategories(raw);
}
