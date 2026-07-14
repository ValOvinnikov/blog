import { isr, runQuery } from '@blog/service/sanity/query';

import { blogPostsCountQuery, buildBlogListQuery } from './query';
import { toBlogPage } from './transformer';
import type { TBlogPage } from './types';

/**
 * Default posts per listing page — fills the 3×3 responsive grid. A single-use
 * scalar tuning value, co-located with its only consumer rather than in shared
 * `@blog/config` (decision 2026-07-14: config is for enum-style key/value
 * consts, not one-off scalars).
 */
const POSTS_PER_PAGE = 9;

export type TGetBlogPageArgs = {
  /** 1-based page number. */
  page?: number;
  pageSize?: number;
};

export async function getBlogPage({
  page = 1,
  pageSize = POSTS_PER_PAGE,
}: TGetBlogPageArgs = {}): Promise<TBlogPage> {
  const start = (page - 1) * pageSize;
  const [rawPosts, total] = await Promise.all([
    runQuery(buildBlogListQuery(start, start + pageSize), isr('posts')),
    runQuery(blogPostsCountQuery, isr('posts')),
  ]);
  return toBlogPage(rawPosts, total, page, pageSize);
}
