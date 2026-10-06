import type { TMaybeUndefined } from '@blog/config';
import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';

import { redirectsQuery } from './query';
import { toRedirectDestination } from './transformer';

export async function getRedirect(
  segments: string[],
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<string>> {
  const redirects = await runQuery(redirectsQuery, {
    tenant,
    ...isr('redirect', tenant.projectId),
  });

  return toRedirectDestination(redirects, `/${segments.join('/')}`);
}
