import type { TMaybeUndefined } from '@blog/config';
import { getSiteSettings } from '@blog/service/features/global/site-settings/adaptor/loader';
import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { topicIndexPageQuery } from './query';
import { toTopicIndexPage } from './transformer';
import type { TTopicIndexPage } from './types';

export async function getIndexPage(
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<TTopicIndexPage>> {
  const rawPage = await runQuery(topicIndexPageQuery, {
    tenant,
    ...isr(['page_topicIndex', 'modules:taxonomyList'], tenant.projectId),
  });
  if (!rawPage) return undefined;

  const settings = await getSiteSettings(tenant);
  return toTopicIndexPage(rawPage, settings, tenant);
}
