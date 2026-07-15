import { isr, runQuery } from '@blog/service/sanity/query';

import { indexPageParamsQuery } from './query';
import { toIndexPageParams } from './transformer';

export async function getIndexPageParams(): Promise<{ page: string }[]> {
  const raw = await runQuery(indexPageParamsQuery, isr(['posts', 'page_blog']));
  return toIndexPageParams(raw);
}
