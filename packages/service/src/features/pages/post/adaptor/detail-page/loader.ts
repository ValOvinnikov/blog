import type { TMaybeUndefined } from '@blog/config';
import { getSiteSettings } from '@blog/service/features/global/site-settings/adaptor/loader';
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
  // `postPageQuery` derefs `author`/`topic`/`tags[]` — all three tags must
  // ride alongside `page_post` (tag-scope contract, `sanity/query.ts`).
  const [raw, settings] = await Promise.all([
    runQuery(postPageQuery, {
      parameters: { slug },
      tenant,
      ...isr(['page_post', 'author', 'topic', 'tag'], tenant.projectId),
    }),
    getSiteSettings(tenant),
  ]);
  if (!raw) return undefined;

  return toPostDetail(raw, settings, tenant);
}
