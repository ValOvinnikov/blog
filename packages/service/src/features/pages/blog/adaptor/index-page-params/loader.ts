import { isr, runQuery } from '@blog/service/sanity/query';

import { indexPageParamsQuery } from './query';
import { toIndexPageParams } from './transformer';

export async function getIndexPageParams(): Promise<{ page: string }[]> {
  // Derefs `postList` — that tag must ride alongside `posts`/`page_blog`
  // (tag-scope contract, `sanity/query.ts`).
  const raw = await runQuery(
    indexPageParamsQuery,
    isr(['posts', 'page_blog', 'modules:postList']),
  );
  return toIndexPageParams(raw);
}
