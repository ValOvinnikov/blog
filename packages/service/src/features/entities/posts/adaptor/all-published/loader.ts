import { isr } from '@shinefold/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@shinefold/service/sanity/query/query';

import { allPublishedPostsQuery } from './query';
import { toAllPublishedPosts, type TFeedPost } from './transformer';

export async function getAllPublishedPosts(
  tenant: TTenantSanityContext,
): Promise<TFeedPost[]> {
  const raw = await runQuery(allPublishedPostsQuery, {
    tenant,
    ...isr(['posts'], tenant.projectId),
  });
  return toAllPublishedPosts(raw);
}
