import {
  toAllPublishedPosts,
  type TFeedPost,
} from '@blog/service/features/entities/posts/adaptor/all-published/transformer';
import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { tagScopedPublishedPostsQuery } from './query';

export async function getPublishedPostsByTag(
  tagId: string,
  tenant: TTenantSanityContext,
): Promise<TFeedPost[]> {
  const raw = await runQuery(tagScopedPublishedPostsQuery, {
    parameters: { tagId },
    tenant,
    ...isr(['posts'], tenant.projectId),
  });
  return toAllPublishedPosts(raw);
}
