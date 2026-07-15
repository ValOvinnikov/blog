import { POSTS_PER_PAGE } from '@blog/service/features/pages/blog/adaptor/pagination';
import { isr, runQuery } from '@blog/service/sanity/query';

import { indexPageCountQuery } from './query';
import { toIndexPageParams } from './transformer';

export async function getIndexPageParams(
  pageSize = POSTS_PER_PAGE,
): Promise<{ page: string }[]> {
  const total = await runQuery(indexPageCountQuery, isr('posts'));
  return toIndexPageParams(total, pageSize);
}
