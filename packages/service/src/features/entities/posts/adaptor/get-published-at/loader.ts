import type { TMaybeUndefined } from '@shinefold/config';
import {
  runQuery,
  type TTenantSanityContext,
} from '@shinefold/service/sanity/query/query';

import { postPublishedAtQuery } from './query';

/** Read past the Data Cache: a publish webhook must see the date it was fired for. */
export async function getPostPublishedAt(
  id: string,
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<string>> {
  const raw = await runQuery(postPublishedAtQuery, {
    parameters: { id },
    tenant,
    cache: 'no-store',
  });

  if (!raw) return undefined;

  return raw.publishedAt;
}
