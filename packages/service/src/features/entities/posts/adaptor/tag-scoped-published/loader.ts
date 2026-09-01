import {
  toAllPublishedPosts,
  type TFeedPost,
} from '@blog/service/features/entities/posts/adaptor/all-published/transformer';
import { isr, runQuery } from '@blog/service/sanity/query';

import { tagScopedPublishedPostsQuery } from './query';

export async function getPublishedPostsByTag(
  tagId: string,
): Promise<TFeedPost[]> {
  const raw = await runQuery(tagScopedPublishedPostsQuery, {
    parameters: { tagId },
    ...isr(['posts']),
  });
  return toAllPublishedPosts(raw);
}
