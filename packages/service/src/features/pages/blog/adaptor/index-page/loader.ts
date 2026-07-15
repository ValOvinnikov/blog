import { POSTS_PER_PAGE } from '@blog/service/features/pages/blog/adaptor/pagination';
import { isr, runQuery } from '@blog/service/sanity/query';

import { blogPageQuery, buildIndexPageQuery } from './query';
import { toIndexPage } from './transformer';
import type { TBlogIndexPage } from './types';

export type TGetIndexPageArgs = {
  page?: number;
};

export async function getIndexPage({
  page = 1,
}: TGetIndexPageArgs = {}): Promise<TBlogIndexPage> {
  // The window size is itself CMS-authored (page_blog.itemsPerPage), so it
  // must be resolved before the posts query's slice bounds can be built —
  // the two fetches can't run in parallel.
  const rawPage = await runQuery(blogPageQuery, isr('page_blog'));
  const pageSize = rawPage?.itemsPerPage ?? POSTS_PER_PAGE;
  const start = (page - 1) * pageSize;
  const rawPosts = await runQuery(
    buildIndexPageQuery(start, start + pageSize),
    isr('posts'),
  );
  return toIndexPage(rawPage, rawPosts, page, pageSize);
}
