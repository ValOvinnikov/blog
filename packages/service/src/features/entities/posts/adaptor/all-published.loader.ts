import { isr, runQuery } from '@blog/service/sanity/query';

import { allPublishedPostsQuery } from './all-published.query';
import {
  toAllPublishedPosts,
  type TFeedPost,
} from './all-published.transformer';

export async function getAllPublishedPosts(): Promise<TFeedPost[]> {
  const raw = await runQuery(allPublishedPostsQuery, isr(['posts']));
  return toAllPublishedPosts(raw);
}
