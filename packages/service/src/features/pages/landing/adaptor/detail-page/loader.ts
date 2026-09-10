import type { TMaybeUndefined } from '@blog/config';
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

  return toLandingPage(raw, tenant);
}
