import { isr, runQuery } from '@blog/service/sanity/query';

import { POSTS_PER_PAGE } from '../index-page/loader';

import { indexPageCountQuery } from './query';

export async function getIndexPageParams(
  pageSize = POSTS_PER_PAGE,
): Promise<{ page: string }[]> {
  const total = await runQuery(indexPageCountQuery, isr('posts'));
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  // pages 2…totalPages ( /blog is page 1, handled by the base route )
  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
    page: String(i + 2),
  }));
}
