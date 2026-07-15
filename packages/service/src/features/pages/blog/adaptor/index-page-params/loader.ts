import {
  POSTS_PER_PAGE,
  toTotalPages,
} from '@blog/service/features/pages/blog/adaptor/pagination';
import { isr, runQuery } from '@blog/service/sanity/query';

import { indexPageCountQuery } from './query';

export async function getIndexPageParams(
  pageSize = POSTS_PER_PAGE,
): Promise<{ page: string }[]> {
  const total = await runQuery(indexPageCountQuery, isr('posts'));
  const totalPages = toTotalPages(total, pageSize);
  // pages 2…totalPages ( /blog is page 1, handled by the base route )
  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
    page: String(i + 2),
  }));
}
