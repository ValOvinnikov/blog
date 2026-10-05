import 'server-only';

import type { TLocaleIsoCode } from '@blog/config/constants';
import {
  createProjectCache,
  type TSanityProjectRef,
} from '@blog/service/sanity/project-cache/project-cache';
import { env } from '@blog/service/utils/env/env';
import { createClient } from 'next-sanity';

type TSanityClient = ReturnType<typeof createClient>;

export type TTenantSanityContext = TSanityProjectRef & {
  token: string;
  locale?: TLocaleIsoCode;
  defaultLocale?: TLocaleIsoCode;
};

export type TTokenScopedClient = {
  client: TSanityClient;
  token: string;
};

export const API_VERSION = '2024-01-01';
// Next's tagged data cache already sits in front; reading through the CDN
// too lets a just-purged tag re-cache a still-stale CDN response.
const USE_CDN = false;

const getCachedClient = createProjectCache<TTokenScopedClient>();

export function hasToken(token: string) {
  return (entry: TTokenScopedClient) => entry.token === token;
}

export function getClient(tenant: TTenantSanityContext): TSanityClient {
  return getCachedClient(
    tenant,
    () => ({
      client: createClient({
        projectId: tenant.projectId,
        dataset: tenant.dataset,
        apiVersion: API_VERSION,
        useCdn: USE_CDN,
        token: tenant.token,
        perspective: 'published',
      }),
      token: tenant.token,
    }),
    hasToken(tenant.token),
  ).client;
}

/** The platform's own project, for callers that deliberately read it instead of a tenant's. */
export function getPlatformSanityContext(): TTenantSanityContext {
  return {
    projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: env.NEXT_PUBLIC_SANITY_DATASET,
    token: env.SANITY_API_READ_TOKEN ?? '',
  };
}
