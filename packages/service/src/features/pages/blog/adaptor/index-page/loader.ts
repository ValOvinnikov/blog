import { isr, runQuery } from '@blog/service/sanity/query';

import { buildIndexPageQuery } from './query';
import { toIndexPage } from './transformer';
import type { TBlogIndexPage } from './types';

export const POSTS_PER_PAGE = 9;

export type TGetIndexPageArgs = {
  page?: number;
  pageSize?: number;
};

export async function getIndexPage({
  page = 1,
  pageSize = POSTS_PER_PAGE,
}: TGetIndexPageArgs = {}): Promise<TBlogIndexPage> {
  const start = (page - 1) * pageSize;
  const raw = await runQuery(
    buildIndexPageQuery(start, start + pageSize),
    isr('posts'),
  );
  return toIndexPage(raw, page, pageSize);
}
