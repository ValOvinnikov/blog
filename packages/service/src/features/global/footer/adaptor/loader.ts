import { isr, runQuery } from '@blog/service/sanity/query';

import { footerQuery } from './query';
import { toFooter } from './transformer';
import type { TFooter } from './types';

// `footerQuery` projects `social[]` through `linkFragment`, whose
// `internalReference` can resolve to `blog_post`/`blog_category`/
// `page_generic`/`page_blog` — every one of those types' tags must be
// included (tag-scope contract, `sanity/query.ts`).
export async function getFooter(): Promise<TFooter> {
  const raw = await runQuery(
    footerQuery,
    isr(['footer', 'post', 'category', 'page_generic', 'page_blog']),
  );
  return toFooter(raw);
}
