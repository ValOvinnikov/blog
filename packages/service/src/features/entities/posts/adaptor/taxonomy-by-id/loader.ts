import type { TMaybeUndefined } from '@blog/config';
import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { postTaxonomyByIdQuery } from './query';
import { toPostTaxonomySlugs, type TPostTaxonomySlugs } from './transformer';

/**
 * Resolves the tag- and topic-page slugs a post belongs to, by the post's
 * own `_id` — for callers (the publish webhook) whose payload carries no
 * taxonomy references of its own.
 */
export async function getPostTaxonomySlugs(
  postId: string,
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<TPostTaxonomySlugs>> {
  const raw = await runQuery(postTaxonomyByIdQuery, {
    parameters: { postId },
    tenant,
    ...isr(['posts', 'page_tag', 'page_topic'], tenant.projectId),
  });
  if (!raw) return undefined;

  return toPostTaxonomySlugs(raw);
}
