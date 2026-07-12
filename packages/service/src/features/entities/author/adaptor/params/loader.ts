import { isr, runQuery } from '@blog/service/sanity/query';

import { authorParamsQuery } from './query';

export async function getAuthorParams(): Promise<{ slug: string }[]> {
  return runQuery(authorParamsQuery, isr('author'));
}
