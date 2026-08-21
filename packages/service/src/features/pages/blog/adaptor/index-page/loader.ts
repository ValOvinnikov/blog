import { getSiteSettings } from '@blog/service/features/global/site-settings/adaptor/loader';
import { MissingPostListError } from '@blog/service/features/pages/blog/adaptor/missing-post-list-error';
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
  // The window size is itself CMS-authored (page_blog.postList.pageSize), so
  // it must be resolved before the posts query's slice bounds can be built —
  // the posts fetch can't run in parallel with it. The settings fetch has no
  // such dependency, so it runs alongside the page_blog fetch.
  // `blogPageQuery` derefs `postList` — that tag must ride alongside
  // `page_blog` (tag-scope contract, `sanity/query.ts`).
  const [rawPage, settings] = await Promise.all([
    runQuery(blogPageQuery, isr(['page_blog', 'modules:postList'])),
    getSiteSettings(),
  ]);
  if (!rawPage.postList) {
    throw new MissingPostListError();
  }
  const pageSize = rawPage.postList.pageSize;
  const start = (page - 1) * pageSize;
  // `archivePostCardFragment` derefs `topic` — that tag must ride
  // alongside `posts` (tag-scope contract, `sanity/query.ts`).
  const rawPosts = await runQuery(
    buildIndexPageQuery(start, start + pageSize),
    isr(['posts', 'topic']),
  );
  return toIndexPage(rawPage, rawPosts, settings, page, pageSize);
}
