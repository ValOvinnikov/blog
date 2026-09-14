import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { contentModuleQuery } from './query';
import { toContentModule } from './transformer';
import type { TContentModule } from './types';

// `contentModuleQuery` projects `body[]` through `portableTextBodyItemFragment`,
// which resolves each `sharedLinkAnnotation` mark's `shared_link` and,
// through its `internalReference`, can resolve to `page_post`/`blog_topic`/
// `page_landing`/`page_postIndex` — every one of those types' tags must be
// included (tag-scope contract, `sanity/query.ts`).
export async function getContent(
  id: string,
  tenant: TTenantSanityContext,
): Promise<TContentModule> {
  const raw = await runQuery(contentModuleQuery, {
    parameters: { id },
    tenant,
    ...isr(
      [
        'modules:content',
        `module:${id}`,
        'shared_link',
        'page_post',
        'topic',
        'page_landing',
        'page_postIndex',
      ],
      tenant.projectId,
    ),
  });

  return toContentModule(raw);
}
