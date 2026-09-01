import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { footerQuery } from './query';
import { toFooter } from './transformer';
import type { TFooter } from './types';

// `footerQuery` projects `social[]` through `linkFragment`, whose
// `internalReference` can resolve to `blog_post`/`blog_topic`/
// `page_generic`/`page_blog` — every one of those types' tags must be
// included (tag-scope contract, `sanity/query.ts`).
export async function getFooter(
  tenant?: TTenantSanityContext,
): Promise<TFooter> {
  const raw = await runQuery(footerQuery, {
    tenant,
    ...isr(
      ['footer', 'post', 'topic', 'page_generic', 'page_blog'],
      tenant?.projectId,
    ),
  });
  return toFooter(raw);
}
