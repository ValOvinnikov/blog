import { env } from '@blog/service/utils/env/env';

import type { TTenantSanityContext } from './client';

/**
 * The `sanity-image` package's own `baseUrl` prop format, as an alternative
 * to passing it separate `projectId`/`dataset` props. Pure string
 * construction — no client, no network call — so it stays importable from
 * environments (e.g. Storybook) that never evaluate `./client`'s
 * `server-only` guard.
 */
export function getSanityImageBaseUrl(tenant?: TTenantSanityContext): string {
  const projectId = tenant?.projectId ?? env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = tenant?.dataset ?? env.NEXT_PUBLIC_SANITY_DATASET;
  return `https://cdn.sanity.io/images/${projectId}/${dataset}/`;
}
