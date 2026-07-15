import { isr, runQuery } from '@blog/service/sanity/query';

import { blogPageCountQuery, buildBlogPageQuery } from './query';
import { toBlogPage } from './transformer';
import type { TBlogPage } from './types';

const POSTS_PER_PAGE = 9;

export type TGetBlogPageArgs = {
  page?: number;
  pageSize?: number;
};

export async function getBlogPage({
  page = 1,
  pageSize = POSTS_PER_PAGE,
}: TGetBlogPageArgs = {}): Promise<TBlogPage> {
  const start = (page - 1) * pageSize;
  const raw = await runQuery(
    buildBlogPageQuery(start, start + pageSize),
    isr('posts'),
  );
  return toBlogPage(raw, page, pageSize);
}

export async function getBlogPageCount(
  pageSize = POSTS_PER_PAGE,
): Promise<number> {
  const total = await runQuery(blogPageCountQuery, isr('posts'));
  return Math.max(1, Math.ceil(total / pageSize));
}
