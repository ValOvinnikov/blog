import { isr, runQuery } from '@blog/service/sanity/query';

import { categoryParamsQuery } from './query';

export async function getCategoryParams(): Promise<{ slug: string }[]> {
  return runQuery(categoryParamsQuery, isr('categories'));
}
