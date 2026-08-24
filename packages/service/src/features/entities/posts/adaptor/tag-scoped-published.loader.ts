import { isr, runQuery } from '@blog/service/sanity/query';

import {
  toAllPublishedPosts,
  type TFeedPost,
} from './all-published.transformer';
import { tagScopedPublishedPostsQuery } from './tag-scoped-published.query';

export async function getPublishedPostsByTag(
  tagId: string,
): Promise<TFeedPost[]> {
  const raw = await runQuery(tagScopedPublishedPostsQuery, {
    parameters: { tagId },
    ...isr(['posts']),
  });
  return toAllPublishedPosts(raw);
}
