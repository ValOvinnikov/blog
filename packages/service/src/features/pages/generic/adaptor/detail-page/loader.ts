import type { TMaybeUndefined } from '@blog/config';
import { getSiteSettings } from '@blog/service/features/global/site-settings/adaptor/loader';
import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { genericPageQuery } from './query';
import { toGenericPage } from './transformer';
import type { TGenericPage } from './types';

export async function getPage(
  slug: string,
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<TGenericPage>> {
  const raw = await runQuery(genericPageQuery, {
    parameters: { slug },
    tenant,
    ...isr('page_generic', tenant.projectId),
  });
  if (!raw) return undefined;

  const settings = await getSiteSettings(tenant);
  return toGenericPage(raw, settings, tenant);
}
