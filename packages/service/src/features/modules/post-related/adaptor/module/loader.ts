import { getRelatedPosts } from '@blog/service/features/modules/post-related/adaptor/posts/loader';
import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';

import { postRelatedModuleQuery } from './query';
import { toPostRelatedModule } from './transformer';
import type { TPostRelatedModule } from './types';

export async function getPostRelated(
  id: string,
  postId: string,
  tenant: TTenantSanityContext,
): Promise<TPostRelatedModule> {
  const raw = await runQuery(postRelatedModuleQuery, {
    parameters: { id },
    tenant,
    ...isr(['modules:postRelated', `module:${id}`], tenant.projectId),
  });

  const posts = await getRelatedPosts(postId, raw.limit, tenant);

  return toPostRelatedModule(raw, posts);
}
