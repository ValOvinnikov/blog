import {
  toAllPublishedPosts,
  type TFeedPost,
} from '@shinefold/service/features/entities/posts/adaptor/all-published/transformer';
import { isr } from '@shinefold/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@shinefold/service/sanity/query/query';

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
