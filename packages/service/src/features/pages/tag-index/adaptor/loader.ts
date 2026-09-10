import type { TMaybeUndefined } from '@blog/config';
import { getSiteSettings } from '@blog/service/features/global/site-settings/adaptor/loader';
import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { tagIndexPageQuery } from './query';
import { toTagIndexPage } from './transformer';
import type { TTagIndexPage } from './types';

export async function getIndexPage(
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<TTagIndexPage>> {
  const rawPage = await runQuery(tagIndexPageQuery, {
    tenant,
    ...isr(['page_tagIndex', 'modules:taxonomyList'], tenant.projectId),
  });
  if (!rawPage) return undefined;

  const settings = await getSiteSettings(tenant);
  return toTagIndexPage(rawPage, settings, tenant);
}
