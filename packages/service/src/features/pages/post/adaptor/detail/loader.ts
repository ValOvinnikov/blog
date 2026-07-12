import { isr, runQuery } from '@blog/service/sanity/query';

import { postDetailQuery } from './query';
import { toPostDetail } from './transformer';
import type { TPostDetail } from './types';

export async function getPost(slug: string): Promise<TPostDetail | null> {
  const raw = await runQuery(postDetailQuery, {
    parameters: { slug },
    ...isr('post'),
  });
  if (!raw) return null;
  return toPostDetail(raw);
}
