import { isr, runQuery } from '@blog/service/sanity/query';

import { authorQuery } from './query';
import { toAuthorDetail } from './transformer';
import type { TAuthorDetail } from './types';

export async function getAuthor(slug: string): Promise<TAuthorDetail | null> {
  const raw = await runQuery(authorQuery, {
    parameters: { slug },
    ...isr('author'),
  });
  if (!raw) return null;
  return toAuthorDetail(raw);
}
