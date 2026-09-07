import { getTenantSanityCredentials } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import { createClient } from '@sanity/client';

import type { TProvisionEnv } from '../lib/env';
import { grantPropagationRetryOptions } from '../lib/grant-propagation-retry';
import { retryWithBackoff } from '../lib/retry-with-backoff';

const SANITY_API_VERSION = '2024-01-01';

const REQUIRED_SINGLETON_TYPES = [
  'settings_site',
  'settings_navigation',
  'settings_footer',
] as const;

export type TVerifyTenantSeededContentDeps = {
  createClient: typeof createClient;
  getCredentials: typeof getTenantSanityCredentials;
  sleep: (ms: number) => Promise<void>;
};

const defaultDeps: TVerifyTenantSeededContentDeps = {
  createClient,
  getCredentials: getTenantSanityCredentials,
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

/**
 * Step 6 — the last step in the sequence: asserts the tenant's dataset
 * actually holds the starter singletons `apps/web`'s render path hard-depends
 * on, rather than trusting the earlier seed step's own report of success.
 * Reads with the tenant's persisted (viewer-scoped) Sanity token, minted by
 * the "Persist Sanity token" step that always runs before this one.
 */
export async function verifyTenantSeededContent(
  tenant: TTenant,
  _env: TProvisionEnv,
  deps: TVerifyTenantSeededContentDeps = defaultDeps,
): Promise<void> {
  const credentials = await deps.getCredentials(tenant.id);

  if (!credentials) {
    throw new Error(
      `verifyTenantSeededContent: tenant "${tenant.id}" has no persisted Sanity read token yet — run the "Persist Sanity token" step first.`,
    );
  }

  const client = deps.createClient({
    projectId: credentials.projectId,
    dataset: credentials.dataset,
    token: credentials.token,
    apiVersion: SANITY_API_VERSION,
    useCdn: false,
  });

  const foundTypes = await retryWithBackoff(
    () =>
      client.fetch<string[]>('*[_type in $types]._type', {
        types: REQUIRED_SINGLETON_TYPES,
      }),
    grantPropagationRetryOptions(deps.sleep),
  );

  const missingTypes = REQUIRED_SINGLETON_TYPES.filter(
    (type) => !foundTypes.includes(type),
  );

  if (missingTypes.length > 0) {
    throw new Error(
      `verifyTenantSeededContent: tenant "${tenant.id}"'s dataset is missing required starter document(s): ${missingTypes.join(', ')}.`,
    );
  }
}
