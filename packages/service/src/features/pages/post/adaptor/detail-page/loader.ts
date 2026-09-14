import type { TMaybeUndefined } from '@blog/config';
import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { postPageQuery } from './query';
import { toPostDetail } from './transformer';
import type { TPostDetail } from './types';

export async function getPost(
  slug: string,
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<TPostDetail>> {
  // `postPageQuery` derefs `author`/`topic`/`tags[]`, and the author's
  // `socialLinks[]` further derefs `shared_link` — all four tags must ride
  // alongside `page_post` (tag-scope contract, `sanity/query.ts`).
  const raw = await runQuery(postPageQuery, {
    parameters: { slug },
    tenant,
    ...isr(
      ['page_post', 'author', 'topic', 'tag', 'shared_link'],
      tenant.projectId,
    ),
  });
  if (!raw) return undefined;

  return toPostDetail(raw);
}
