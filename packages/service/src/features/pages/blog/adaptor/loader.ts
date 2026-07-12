import { isr, runQuery } from '@blog/service/sanity/query';

import { blogListQuery } from './query';
import { toBlogPage } from './transformer';
import type { TBlogPage } from './types';

export async function getBlogPage(): Promise<TBlogPage> {
  const raw = await runQuery(blogListQuery, isr('posts'));
  return toBlogPage(raw);
}
