import { runQuery, isr } from '#/sanity/query';
import { blogListQuery } from './query';
import { toBlogPage } from './transformer';
import type { TBlogPage } from './transformer';

export type { TBlogPage };

export async function getBlogPage(): Promise<TBlogPage> {
  const raw = await runQuery(blogListQuery, isr('posts'));
  return toBlogPage(raw);
}
