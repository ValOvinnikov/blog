import { getBlogIndexSettings } from '@blog/service/features/pages/blog/adaptor/settings/loader';
import { isr, runQuery } from '@blog/service/sanity/query';

import { indexPageCountQuery } from './query';
import { toIndexPageParams } from './transformer';

export async function getIndexPageParams(): Promise<{ page: string }[]> {
  const [settings, total] = await Promise.all([
    getBlogIndexSettings(),
    runQuery(indexPageCountQuery, isr('posts')),
  ]);
  return toIndexPageParams(total, settings.itemsPerPage);
}
