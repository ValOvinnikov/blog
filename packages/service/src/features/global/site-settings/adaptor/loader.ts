import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';

import { siteSettingsQuery } from './query';
import { toSiteSettings } from './transformer';
import type { TSiteSettings } from './types';

export async function getSiteSettings(
  tenant: TTenantSanityContext,
): Promise<TSiteSettings> {
  const raw = await runQuery(siteSettingsQuery, {
    tenant,
    ...isr('site-settings', tenant.projectId),
  });
  return toSiteSettings(raw);
}
