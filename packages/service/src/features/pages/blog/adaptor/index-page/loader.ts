import { getBlogIndexSettings } from '@blog/service/features/pages/blog/adaptor/settings/loader';
import { isr, runQuery } from '@blog/service/sanity/query';

import { buildIndexPageQuery } from './query';
import { toIndexPage } from './transformer';
import type { TBlogIndexPage } from './types';

export type TGetIndexPageArgs = {
  page?: number;
};

export async function getIndexPage({
  page = 1,
}: TGetIndexPageArgs = {}): Promise<TBlogIndexPage> {
  // The window size is itself CMS-authored (settings.itemsPerPage), so it
  // must be resolved before the posts query's slice bounds can be built —
  // the two fetches can't run in parallel.
  const settings = await getBlogIndexSettings();
  const pageSize = settings.itemsPerPage;
  const start = (page - 1) * pageSize;
  const raw = await runQuery(
    buildIndexPageQuery(start, start + pageSize),
    isr('posts'),
  );
  return toIndexPage(raw, settings, page, pageSize);
}
