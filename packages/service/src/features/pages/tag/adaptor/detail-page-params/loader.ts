import { isr, runQuery } from '@blog/service/sanity/query';

import { tagParamsQuery } from './query';

export async function getTagParams(): Promise<{ slug: string }[]> {
  return runQuery(tagParamsQuery, isr('tags'));
}
