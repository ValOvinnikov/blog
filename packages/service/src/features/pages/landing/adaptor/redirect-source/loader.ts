import type { TMaybeUndefined } from '@shinefold/config';
import {
  runQuery,
  type TTenantSanityContext,
} from '@shinefold/service/sanity/query/query';

import { redirectSourceQuery } from './query';
import { toLandingRedirectSource } from './transformer';
import type { TLandingRedirectSource } from './types';

/** Read past the Data Cache: a publish webhook must see the source it was fired for. */
export async function getRedirectSource(
  id: string,
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<TLandingRedirectSource>> {
  const raw = await runQuery(redirectSourceQuery, {
    parameters: { id },
    tenant,
    cache: 'no-store',
  });

  if (!raw) return undefined;

  return toLandingRedirectSource(raw);
}
