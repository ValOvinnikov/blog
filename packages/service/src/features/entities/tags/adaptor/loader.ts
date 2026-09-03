import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { tagsQuery } from './query';
import { toTags } from './transformer';
import type { TTagsList } from './types';

/** Every tag with its title/slug and published-post count, alphabetical by title. */
export async function getTags(
  tenant: TTenantSanityContext,
): Promise<TTagsList> {
  const raw = await runQuery(tagsQuery, {
    tenant,
    ...isr(['tags', 'posts'], tenant.projectId),
  });
  return toTags(raw);
}
