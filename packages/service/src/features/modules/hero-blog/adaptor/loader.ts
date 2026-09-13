import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { heroBlogModuleQuery } from './query';
import { toHeroBlogModule } from './transformer';
import type { THeroBlogModule } from './types';

// The tags below must cover every document type the query derefs — the
// resolved post's author/topic and the secondary action's link target —
// not just the module itself.
export async function getHeroBlog(
  id: string,
  tenant: TTenantSanityContext,
): Promise<THeroBlogModule> {
  const raw = await runQuery(heroBlogModuleQuery, {
    parameters: { id },
    tenant,
    ...isr(
      [
        'modules:heroBlog',
        `module:${id}`,
        'posts',
        'author',
        'topic',
        'page_post',
        'page_landing',
        'page_blog',
        'page_postIndex',
      ],
      tenant.projectId,
    ),
  });

  return toHeroBlogModule(raw);
}
