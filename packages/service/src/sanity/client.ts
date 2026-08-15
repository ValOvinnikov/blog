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

let legacyClient: TSanityClient | undefined;

// Small LRU (insertion-order Map: re-set moves an entry to the end) —
// sized for "tens of tenants" per the multi-tenant design's target scale,
// not meant to hold every tenant that has ever existed.
const MAX_CACHED_TENANT_CLIENTS = 20;
const tenantClients = new Map<string, TSanityClient>();

function tenantClientKey(tenant: TTenantSanityContext): string {
  return `${tenant.projectId}:${tenant.dataset}`;
}

/**
 * No-arg call returns the legacy single-tenant client (env-configured) —
 * unchanged behavior for every `service.*` loader not yet migrated to
 * per-tenant context. Called with a `TTenantSanityContext`, returns (and
 * LRU-caches) a client scoped to that tenant's own project/dataset/token.
 */
export function getClient(tenant?: TTenantSanityContext): TSanityClient {
  if (!tenant) {
    if (legacyClient) return legacyClient;

    legacyClient = createClient({
      projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      dataset: env.NEXT_PUBLIC_SANITY_DATASET,
      apiVersion: API_VERSION,
      useCdn: USE_CDN,
      token: env.SANITY_API_READ_TOKEN,
      // Explicit (already the default): never serve draft content to the public.
      perspective: 'published',
    });

    return legacyClient;
  }

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
