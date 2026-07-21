import { isr, runQuery } from '@blog/service/sanity/query';

import { genericPageParamsQuery } from './query';

export async function getPageSlugs(): Promise<{ slug: string }[]> {
  return runQuery(genericPageParamsQuery, isr('page_generic'));
}
