import type { TMaybeUndefined } from '@blog/config';
import { getSiteSettings } from '@blog/service/features/global/site-settings/adaptor/loader';
import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { topicPageQuery } from './query';
import { toTopicDetailPage } from './transformer';
import type { TTopicDetailPage } from './types';

export async function getTopicPage(
  slug: string,
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<TTopicDetailPage>> {
  // `topicPageQuery` derefs `topic`'s full fragment — that tag must ride
  // alongside `page_topic` (tag-scope contract, `sanity/query.ts`).
  // `hero`/`modules[]` stay thin (`moduleFragment`), so no tag of their own.
  const rawPage = await runQuery(topicPageQuery, {
    parameters: { slug },
    tenant,
    ...isr(['page_topic', 'topic'], tenant.projectId),
  });
  if (!rawPage) return undefined;

  const settings = await getSiteSettings(tenant);
  return toTopicDetailPage(rawPage, settings, tenant);
}
