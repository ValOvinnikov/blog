import 'server-only';

import {
  API_VERSION,
  hasToken,
  type TTenantSanityContext,
  type TTokenScopedClient,
} from '@blog/service/sanity/client/client';
import { createProjectCache } from '@blog/service/sanity/project-cache/project-cache';
import { env } from '@blog/service/utils/env/env';
import { createClient } from 'next-sanity';

import { InvalidTenantSanityContextError } from './invalid-tenant-sanity-context-error';

type TSanityWriteClient = ReturnType<typeof createClient>;

// `raw`, not `published`: mutations target exact draft/published `_id`s.
const PERSPECTIVE = 'raw';

const getCachedWriteClient = createProjectCache<TTokenScopedClient>();

function assertValidTenantContext(tenant: TTenantSanityContext): void {
  if (
    !tenant.projectId?.trim() ||
    !tenant.dataset?.trim() ||
    !tenant.token?.trim()
  ) {
    throw new InvalidTenantSanityContextError();
  }
}

export function getWriteClient(
  tenant: TTenantSanityContext,
): TSanityWriteClient {
  assertValidTenantContext(tenant);

  return getCachedWriteClient(
    tenant,
    () => ({
      client: createClient({
        projectId: tenant.projectId,
        dataset: tenant.dataset,
        apiVersion: API_VERSION,
        useCdn: false,
        token: tenant.token,
        perspective: PERSPECTIVE,
      }),
      token: tenant.token,
    }),
    hasToken(tenant.token),
  ).client;
}

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
