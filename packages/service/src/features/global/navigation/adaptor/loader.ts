import { isr, runQuery } from '@blog/service/sanity/query';

import { navigationQuery } from './query';
import { toNavigation } from './transformer';
import type { TNavigation } from './types';

// `navigationQuery` projects `items[]` through `linkFragment`, whose
// `internalReference` can resolve to `blog_post`/`blog_category`/
// `page_generic`/`page_blog` — every one of those types' tags must be
// included (tag-scope contract, `sanity/query.ts`).
export async function getNavigation(): Promise<TNavigation> {
  const raw = await runQuery(
    navigationQuery,
    isr(['navigation', 'post', 'category', 'page_generic', 'page_blog']),
  );
  return toNavigation(raw);
}
