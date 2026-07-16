import { getSiteSettings } from '@blog/service/features/global/site-settings/adaptor/loader';
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
  // the posts fetch can't run in parallel with it. The settings fetch has no
  // such dependency, so it runs alongside the page_blog fetch.
  const [rawPage, settings] = await Promise.all([
    runQuery(blogPageQuery, isr('page_blog')),
    getSiteSettings(),
  ]);
  const pageSize = rawPage.itemsPerPage;
  const start = (page - 1) * pageSize;
  const rawPosts = await runQuery(
    buildIndexPageQuery(start, start + pageSize),
    isr('posts'),
  );
  return toIndexPage(rawPage, rawPosts, settings, page, pageSize);
}
