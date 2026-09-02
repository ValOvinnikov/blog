import type { TMaybeUndefined } from '@blog/config';
import { getSiteSettings } from '@blog/service/features/global/site-settings/adaptor/loader';
import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { homePageQuery } from './query';
import { toHomePage } from './transformer';
import type { THomePage } from './types';

export async function getHomePage(
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<THomePage>> {
  const raw = await runQuery(homePageQuery, {
    tenant,
    ...isr('homePage', tenant.projectId),
  });
  if (!raw) return undefined;

  const settings = await getSiteSettings(tenant);
  return toHomePage(raw, settings, tenant);
}
