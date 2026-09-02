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

const MAX_CACHED_TENANT_WRITE_CLIENTS = 20;
const tenantWriteClients = new Map<string, TSanityWriteClient>();

function tenantWriteClientKey(tenant: TTenantSanityContext): string {
  return `${tenant.projectId}:${tenant.dataset}`;
}

function assertValidTenantContext(tenant: TTenantSanityContext): void {
  if (
    !tenant.projectId?.trim() ||
    !tenant.dataset?.trim() ||
    !tenant.token?.trim()
  ) {
    throw new InvalidTenantSanityContextError();
  }
}

/**
 * Separate from `getClient()` (the public read client): this one carries a
 * scoped write token and is used only by the publish-time skim pipeline
 * (`features/editorial/skim`) to patch a post's *draft*. Never imported by
 * page-rendering code. There is no no-arg form — a caller that means the
 * platform's own project passes `getPlatformSanityWriteContext()`'s result
 * explicitly.
 */
export function getWriteClient(
  tenant: TTenantSanityContext,
): TSanityWriteClient {
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

/**
 * The platform's own project, expressed as a `TTenantSanityContext` for
 * `getWriteClient()` — the explicit, greppable way to opt into writing to
 * the platform's project instead of a tenant's.
 */
export function getPlatformSanityWriteContext(): TTenantSanityContext {
  if (!env.SANITY_API_WRITE_TOKEN) {
    throw new Error(
      'getPlatformSanityWriteContext: SANITY_API_WRITE_TOKEN is not set — the publish-time skim pipeline is disabled without a scoped write token.',
    );
  }

  return {
    projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: env.NEXT_PUBLIC_SANITY_DATASET,
    token: env.SANITY_API_WRITE_TOKEN,
  };
}
