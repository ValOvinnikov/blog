import type { TMaybeUndefined } from '@blog/config';
import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';

import { redirectsQuery } from './query';
import { toLandingRedirect } from './transformer';
import type { TLandingRedirect } from './types';

export async function getRedirect(
  segments: string[],
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<TLandingRedirect>> {
  const redirects = await runQuery(redirectsQuery, {
    tenant,
    ...isr('redirect', tenant.projectId),
  });

  return toLandingRedirect(redirects, `/${segments.join('/')}`);
}
