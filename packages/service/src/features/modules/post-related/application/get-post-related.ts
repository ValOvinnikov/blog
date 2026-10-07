import { getPostRelatedModuleDocument } from '@blog/service/features/modules/post-related/adaptor/module/loader';
import { getRelatedPosts } from '@blog/service/features/modules/post-related/adaptor/posts/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query/query';

import type { TPostRelatedModule } from './types';

export async function getPostRelated(
  id: string,
  postId: string,
  tenant: TTenantSanityContext,
): Promise<TPostRelatedModule> {
  const { limit, ...module } = await getPostRelatedModuleDocument(id, tenant);
  const posts = await getRelatedPosts(postId, limit, tenant);

  return { ...module, posts };
}
