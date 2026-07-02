import { runQuery, isr } from '#/sanity/query';
import { authorQuery } from './query';
import { toAuthorDetail } from './transformer';
import type { TAuthorDetail } from './transformer';

export type { TAuthorDetail };

export async function getAuthor(slug: string): Promise<TAuthorDetail | null> {
  const raw = await runQuery(authorQuery, {
    parameters: { slug },
    ...isr('author'),
  });
  if (!raw) return null;
  return toAuthorDetail(raw);
}
