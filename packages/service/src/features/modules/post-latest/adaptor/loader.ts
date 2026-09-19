import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

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
    ...isr(['posts', 'author', 'topic'], tenant.projectId),
  });

  return toPostLatestModule(raw, rawPosts);
}
