import type { TMaybeUndefined } from '@shinefold/config';
import { isr } from '@shinefold/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@shinefold/service/sanity/query/query';
import { LINK_TARGET_CACHE_TAGS } from '@shinefold/service/shared/cache-tags/link/link-target-cache-tags';

import { postPageQuery } from './query';
import { toPostDetail } from './transformer';
import type { TPostDetail } from './types';

export async function getPost(
  slug: string,
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<TPostDetail>> {
  const raw = await runQuery(postPageQuery, {
    parameters: { slug },
    tenant,
    ...isr(
      ['page_post', 'author', 'topic', 'tag', ...LINK_TARGET_CACHE_TAGS],
      tenant.projectId,
    ),
  });
  if (!raw) return undefined;

  return toPostDetail(raw);
}
