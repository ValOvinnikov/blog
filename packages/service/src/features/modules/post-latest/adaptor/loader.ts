import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';
import { LINK_TARGET_CACHE_TAGS } from '@blog/service/shared/cache-tags/link/link-target-cache-tags';

import { postLatestModulePostsQuery } from './posts.query';
import { postLatestModuleQuery } from './query';
import { toPostLatestModule } from './transformer';
import type { TPostLatestModule } from './types';

export async function getPostLatest(
  id: string,
  tenant: TTenantSanityContext,
): Promise<TPostLatestModule> {
  const raw = await runQuery(postLatestModuleQuery, {
    parameters: { id },
    tenant,
    ...isr(['modules:postLatest', `module:${id}`], tenant.projectId),
  });

  const rawPosts = await runQuery(postLatestModulePostsQuery(raw.limit), {
    tenant,
    ...isr(
      ['posts', 'author', 'topic', ...LINK_TARGET_CACHE_TAGS],
      tenant.projectId,
    ),
  });

  return toPostLatestModule(raw, rawPosts);
}
