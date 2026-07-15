import { getBlogIndexSettings } from '@blog/service/features/pages/blog/adaptor/settings/loader';
import { isr, runQuery } from '@blog/service/sanity/query';

import { indexPageCountQuery } from './query';
import { toIndexPageParams } from './transformer';

export async function getIndexPageParams(): Promise<{ page: string }[]> {
  // Independent of one another (the count doesn't depend on the page size),
  // so these can run in parallel.
  const [settings, total] = await Promise.all([
    getBlogIndexSettings(),
    runQuery(indexPageCountQuery, isr('posts')),
  ]);
  return toIndexPageParams(total, settings.itemsPerPage);
}
