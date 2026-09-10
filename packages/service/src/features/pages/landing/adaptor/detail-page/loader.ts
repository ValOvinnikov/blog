import type { TMaybeUndefined } from '@blog/config';
import { getSiteSettings } from '@blog/service/features/global/site-settings/adaptor/loader';
import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { landingPageQuery } from './query';
import { toLandingPage } from './transformer';
import type { TLandingPage } from './types';

export async function getPage(
  slug: string,
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<TLandingPage>> {
  const raw = await runQuery(landingPageQuery, {
    parameters: { slug },
    tenant,
    ...isr('page_landing', tenant.projectId),
  });
  if (!raw) return undefined;

  const settings = await getSiteSettings(tenant);
  return toLandingPage(raw, settings, tenant);
}
