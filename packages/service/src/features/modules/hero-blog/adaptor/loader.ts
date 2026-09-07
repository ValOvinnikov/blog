import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { heroBlogModuleQuery } from './query';
import { toHeroBlogModule } from './transformer';
import type { THeroBlogModule } from './types';

// `heroBlogModuleQuery` resolves the post inside the module projection
// (via `postCardFragment`, which further derefs `author`/`topic`) and
// derefs `secondaryAction`'s link (whose `internalReference` can resolve to
// `blog_post`/`blog_topic`/`page_generic`/`page_blog`) — every one of those
// types' tags must be included alongside the module's own tags (tag-scope
// contract, `sanity/query.ts`). One round trip covers both.
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
        'post',
        'page_generic',
        'page_blog',
      ],
      tenant.projectId,
    ),
  });

  return toHeroBlogModule(raw, tenant);
}
