import type { TMaybeUndefined } from '@shinefold/config';
import {
  runQuery,
  type TTenantSanityContext,
} from '@shinefold/service/sanity/query/query';
import { uncachedRead } from '@shinefold/service/sanity/query/uncached-read';

import { redirectSourceQuery } from './query';
import { toLandingRedirectSource } from './transformer';
import type { TLandingRedirectSource } from './types';

export async function getRedirectSource(
  id: string,
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<TLandingRedirectSource>> {
  const raw = await runQuery(redirectSourceQuery, {
    parameters: { id },
    tenant,
    ...uncachedRead(),
  });

  if (!raw) return undefined;

  return toLandingRedirectSource(raw);
}
