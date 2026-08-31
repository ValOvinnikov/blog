import { env } from '@blog/service/utils/env/env';

import type { TTenantSanityContext } from './client';

/**
 * The `sanity-image` package's own `baseUrl` prop format, as an alternative
 * to passing it separate `projectId`/`dataset` props. Reads only
 * `client`-declared env vars, so it's safe to call from any environment
 * (e.g. Storybook running in a real browser).
 */
export function getSanityImageBaseUrl(tenant?: TTenantSanityContext): string {
  const projectId = tenant?.projectId ?? env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = tenant?.dataset ?? env.NEXT_PUBLIC_SANITY_DATASET;
  return `https://cdn.sanity.io/images/${projectId}/${dataset}/`;
}
