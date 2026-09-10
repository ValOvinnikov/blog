import type { TMaybeUndefined } from '@blog/config';
import { getSiteSettings } from '@blog/service/features/global/site-settings/adaptor/loader';
import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { tagPageQuery } from './query';
import { toTagDetailPage } from './transformer';
import type { TTagDetailPage } from './types';

export async function getTagPage(
  slug: string,
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<TTagDetailPage>> {
  // `tagPageQuery` derefs `tag`'s full fragment — that tag must ride
  // alongside `page_tag` (tag-scope contract, `sanity/query.ts`).
  // `hero`/`modules[]` stay thin (`moduleFragment`), so no tag of their own.
  const rawPage = await runQuery(tagPageQuery, {
    parameters: { slug },
    tenant,
    ...isr(['page_tag', 'tag'], tenant.projectId),
  });
  if (!rawPage) return undefined;

  const settings = await getSiteSettings(tenant);
  return toTagDetailPage(rawPage, settings, tenant);
}
