import { isr, runQuery } from '@blog/service/sanity/query';
import type { TPostCard } from '@blog/service/shared/transformers/to-post-card';

import { authorPostsQuery } from './query';
import { toAuthorPosts } from './transformer';

export async function getAuthorPosts(slug: string): Promise<TPostCard[]> {
  const raw = await runQuery(authorPostsQuery, {
    parameters: { slug },
    ...isr('posts'),
  });
  return toAuthorPosts(raw);
}
