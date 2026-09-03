// Fails the build if this module is ever pulled into a client bundle — the
// Sanity client reads SANITY_API_READ_TOKEN and must stay server-only.
import 'server-only';

import { env } from '@blog/service/utils/env/env';
import { createClient } from 'next-sanity';

type TSanityClient = ReturnType<typeof createClient>;

export type TTenantSanityContext = {
  projectId: string;
  dataset: string;
  token: string;
};

const API_VERSION = '2024-01-01';
// Next's tagged data cache is the caching layer (webhook-driven
// revalidation). Reading through Sanity's CDN on top of it lets a
// just-purged tag refetch a still-stale CDN response and re-cache it
// for up to an hour — origin reads stay rare because ISR absorbs them.
const USE_CDN = false;

// Small LRU (insertion-order Map: re-set moves an entry to the end) —
// sized for "tens of tenants" per the multi-tenant design's target scale,
// not meant to hold every tenant that has ever existed.
const MAX_CACHED_TENANT_CLIENTS = 20;
const tenantClients = new Map<string, TSanityClient>();

function tenantClientKey(tenant: TTenantSanityContext): string {
  return `${tenant.projectId}:${tenant.dataset}`;
}

/**
 * Returns (and LRU-caches) a client scoped to the given tenant's own
 * project/dataset/token. There is no no-arg form — every caller states
 * which project it means to read, the platform's own included (via
 * `getPlatformSanityContext()`), so omitting one is a compile error rather
 * than a silent fallback.
 */
export function getClient(tenant: TTenantSanityContext): TSanityClient {
  const key = tenantClientKey(tenant);
  const cached = tenantClients.get(key);
  if (cached) {
    // Re-inserting moves the key to the Map's end — the LRU's
    // most-recently-used position — without creating a new client.
    tenantClients.delete(key);
    tenantClients.set(key, cached);
    return cached;
  }

  const client = createClient({
    projectId: tenant.projectId,
    dataset: tenant.dataset,
    apiVersion: API_VERSION,
    useCdn: USE_CDN,
    token: tenant.token,
    perspective: 'published',
  });

  tenantClients.set(key, client);
  if (tenantClients.size > MAX_CACHED_TENANT_CLIENTS) {
    const oldestKey = tenantClients.keys().next().value;
    if (oldestKey !== undefined) tenantClients.delete(oldestKey);
  }

  return client;
}

/**
 * The platform's own project, expressed as a `TTenantSanityContext` — the
 * explicit, greppable way to opt into the platform's project instead of a
 * tenant's, for the handful of callers that genuinely mean that (single-
 * tenant local/preview development, the static-params slices).
 */
export function getPlatformSanityContext(): TTenantSanityContext {
  return {
    projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: env.NEXT_PUBLIC_SANITY_DATASET,
    token: env.SANITY_API_READ_TOKEN ?? '',
  };
}

/** `getClient(getPlatformSanityContext())` — reuses the same tenant-keyed cache, never a client per call. */
export function getPlatformClient(): TSanityClient {
  return getClient(getPlatformSanityContext());
}
