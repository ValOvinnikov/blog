import type { TMaybeUndefined } from '@shinefold/config';
import { isr } from '@shinefold/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@shinefold/service/sanity/query/query';

import { tagPageQuery } from './query';
import { toTagDetailPage } from './transformer';
import type { TTagDetailPageDocument } from './types';

export async function getTagPageDocument(
  slug: string,
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<TTagDetailPageDocument>> {
  const rawPage = await runQuery(tagPageQuery, {
    parameters: { slug },
    tenant,
    ...isr(['page_tag', 'template_tag', 'tag'], tenant.projectId),
  });
  if (!rawPage) return undefined;

  return toTagDetailPage(rawPage);
}
