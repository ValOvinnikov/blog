import type { TMaybeUndefined } from '@shinefold/config';
import {
  runQuery,
  type TTenantSanityContext,
} from '@shinefold/service/sanity/query/query';
import { uncachedRead } from '@shinefold/service/sanity/query/uncached-read';

import { postPublishedAtQuery } from './query';

export async function getPostPublishedAt(
  id: string,
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<string>> {
  const raw = await runQuery(postPublishedAtQuery, {
    parameters: { id },
    tenant,
    ...uncachedRead(),
  });

  if (!raw) return undefined;

  return raw.publishedAt;
}
