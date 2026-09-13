import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { footerQuery } from './query';
import { toFooter } from './transformer';
import type { TFooter } from './types';

// `footerQuery` projects `social[]` through `linkFragment`, whose
// `internalReference` can resolve to `page_post`/`blog_topic`/
// `page_landing`/`page_blog`/`page_postIndex` — every one of those types'
// tags must be included (tag-scope contract, `sanity/query.ts`).
export async function getFooter(
  tenant: TTenantSanityContext,
): Promise<TFooter> {
  const raw = await runQuery(footerQuery, {
    tenant,
    ...isr(
      [
        'footer',
        'page_post',
        'topic',
        'page_landing',
        'page_blog',
        'page_postIndex',
      ],
      tenant.projectId,
    ),
  });
  return toFooter(raw);
}
