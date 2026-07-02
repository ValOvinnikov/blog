import { isr, runQuery } from '#/sanity/query';

import { postParamsQuery } from './query';

export async function getPostParams(): Promise<{ slug: string }[]> {
  return runQuery(postParamsQuery, isr('posts'));
}
