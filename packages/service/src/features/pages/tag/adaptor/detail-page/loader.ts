import type { TMaybeUndefined } from '@blog/config';
import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';

import { tagPageQuery } from './query';
import { toTagDetailPage } from './transformer';
import type { TTagDetailPage } from './types';

export async function getTagPage(
  slug: string,
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<TTagDetailPage>> {
  const rawPage = await runQuery(tagPageQuery, {
    parameters: { slug },
    tenant,
    ...isr(['page_tag', 'tag'], tenant.projectId),
  });
  if (!rawPage) return undefined;

  return toTagDetailPage(rawPage);
}
