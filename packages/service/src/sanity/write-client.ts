// Fails the build if this module is ever pulled into a client bundle — the
// Sanity write client reads SANITY_API_WRITE_TOKEN and must stay server-only.
import 'server-only';

import { env } from '@blog/service/utils/env/env';
import { createClient } from 'next-sanity';

import type { TTenantSanityContext } from './client';
import { InvalidTenantSanityContextError } from './invalid-tenant-sanity-context-error';

type TSanityWriteClient = ReturnType<typeof createClient>;

const API_VERSION = '2024-01-01';
// Mutations target exact `_id`s (draft vs published) directly, and
// `getDocument` needs to resolve the published id even though a draft may
// also exist — `raw` (unlike `published`) makes both visible.
const PERSPECTIVE = 'raw';

let writeClient: TSanityWriteClient | undefined;

const MAX_CACHED_TENANT_WRITE_CLIENTS = 20;
const tenantWriteClients = new Map<string, TSanityWriteClient>();

function tenantWriteClientKey(tenant: TTenantSanityContext): string {
  return `${tenant.projectId}:${tenant.dataset}`;
}

function assertValidTenantContext(tenant: TTenantSanityContext): void {
  if (
    !tenant.projectId.trim() ||
    !tenant.dataset.trim() ||
    !tenant.token.trim()
  ) {
    throw new InvalidTenantSanityContextError();
  }
}

/**
 * Separate from `getClient()` (the public read client): this one carries a
 * scoped write token and is used only by the publish-time skim pipeline
 * (`features/editorial/skim`) to patch a post's *draft*. Never imported by
 * page-rendering code. No-arg call returns the legacy platform write client
 * (env-configured, unchanged). Called with a `TTenantSanityContext`, returns
 * (and LRU-caches) a client scoped to that tenant's own project/dataset/token.
 */
export function getWriteClient(
  tenant?: TTenantSanityContext,
): TSanityWriteClient {
  if (!tenant) {
    if (!env.SANITY_API_WRITE_TOKEN) {
      throw new Error(
        'getWriteClient: SANITY_API_WRITE_TOKEN is not set — the publish-time skim pipeline is disabled without a scoped write token.',
      );
    }

    if (writeClient) return writeClient;

    writeClient = createClient({
      projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      dataset: env.NEXT_PUBLIC_SANITY_DATASET,
      apiVersion: API_VERSION,
      useCdn: false,
      token: env.SANITY_API_WRITE_TOKEN,
      perspective: PERSPECTIVE,
    });

    return writeClient;
  }

  assertValidTenantContext(tenant);

  const key = tenantWriteClientKey(tenant);
  const cached = tenantWriteClients.get(key);
  if (cached) {
    tenantWriteClients.delete(key);
    tenantWriteClients.set(key, cached);
    return cached;
  }

  const client = createClient({
    projectId: tenant.projectId,
    dataset: tenant.dataset,
    apiVersion: API_VERSION,
    useCdn: false,
    token: tenant.token,
    perspective: PERSPECTIVE,
  });

  tenantWriteClients.set(key, client);
  if (tenantWriteClients.size > MAX_CACHED_TENANT_WRITE_CLIENTS) {
    const oldestKey = tenantWriteClients.keys().next().value;
    if (oldestKey !== undefined) tenantWriteClients.delete(oldestKey);
  }

  return client;
}
