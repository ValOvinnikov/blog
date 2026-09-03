import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { publishedPostBodyQuery } from './query';
import type { TPostBody } from './types';

// No `isr()`/tags here — this reads a single published post on demand right
// after its publish webhook fires, not as part of page rendering, so it must
// never serve a stale cached response.
export async function getPublishedPostBody(
  postId: string,
  tenant: TTenantSanityContext,
): Promise<TPostBody> {
  const raw = await runQuery(publishedPostBodyQuery, {
    parameters: { id: postId },
    tenant,
  });

  return raw.body;
}
