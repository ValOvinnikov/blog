import { getTenantSanityCredentials } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import { createClient } from '@sanity/client';

import type { TProvisionEnv } from '../lib/env';
import { grantPropagationRetryOptions } from '../lib/grant-propagation-retry';
import {
  retryWithBackoff,
  type TRetryWithBackoffOptions,
} from '../lib/retry-with-backoff';
import {
  listSanityWebhooks,
  type TSanityWebhook,
} from '../lib/sanity-management-client';
import {
  listVercelProjectDomains,
  type TVercelDomain,
} from '../lib/vercel-client';

import { revalidateWebhookUrl } from './create-revalidate-webhook';

const SANITY_API_VERSION = '2024-01-01';

const REQUIRED_SINGLETON_TYPES = [
  'settings_site',
  'settings_navigation',
  'settings_footer',
] as const;

export type TVerifyTenantSeededContentDeps = {
  createClient: typeof createClient;
  getCredentials: typeof getTenantSanityCredentials;
  listWebhooks: typeof listSanityWebhooks;
  listDomains: typeof listVercelProjectDomains;
  sleep: (ms: number) => Promise<void>;
};

const defaultDeps: TVerifyTenantSeededContentDeps = {
  createClient,
  getCredentials: getTenantSanityCredentials,
  listWebhooks: listSanityWebhooks,
  listDomains: listVercelProjectDomains,
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

async function readWithGrantPropagationRetry<T>(
  read: () => Promise<T>,
  retryOptions: TRetryWithBackoffOptions,
  wrapError: (error: unknown) => Error,
): Promise<T> {
  try {
    return await retryWithBackoff(read, retryOptions);
  } catch (error) {
    throw wrapError(error);
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Step 6 — the last step in the sequence: asserts every external resource
 * the run claims to have created is actually real and working, rather than
 * trusting each earlier step's own report of success — the tenant's seeded
 * content, its persisted Sanity read token, its revalidate webhook, and its
 * mapped Vercel domain. Reads that immediately follow a write in this same
 * run (a freshly-minted token, a freshly-created webhook/domain) retry
 * through `grantPropagationRetryOptions` so a transient propagation-lag
 * error is never conflated with the resource genuinely being absent.
 */
export async function verifyTenantSeededContent(
  tenant: TTenant,
  env: TProvisionEnv,
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

  const retryOptions = grantPropagationRetryOptions(deps.sleep);

  const foundTypes = await readWithGrantPropagationRetry(
    () =>
      client.fetch<string[]>('*[_type in $types]._type', {
        types: REQUIRED_SINGLETON_TYPES,
      }),
    retryOptions,
    (error) =>
      new Error(
        `verifyTenantSeededContent: tenant "${tenant.id}"'s persisted Sanity read token failed against its dataset: ${errorMessage(error)}`,
        { cause: error },
      ),
  );

  const missingTypes = REQUIRED_SINGLETON_TYPES.filter(
    (type) => !foundTypes.includes(type),
  );

  if (missingTypes.length > 0) {
    throw new Error(
      `verifyTenantSeededContent: tenant "${tenant.id}"'s dataset is missing required starter document(s): ${missingTypes.join(', ')}.`,
    );
  }

  const webhooks = await readWithGrantPropagationRetry<TSanityWebhook[]>(
    () =>
      deps.listWebhooks({
        token: env.sanityManagementToken,
        projectId: credentials.projectId,
      }),
    retryOptions,
    (error) =>
      new Error(
        `verifyTenantSeededContent: tenant "${tenant.id}"'s revalidate webhook check against its Sanity project failed: ${errorMessage(error)}`,
        { cause: error },
      ),
  );

  const expectedWebhookUrl = revalidateWebhookUrl(env.webAppBaseUrl);
  if (!webhooks.some((webhook) => webhook.url === expectedWebhookUrl)) {
    throw new Error(
      `verifyTenantSeededContent: tenant "${tenant.id}" has no revalidate webhook targeting "${expectedWebhookUrl}" on its Sanity project.`,
    );
  }

  const domains = await readWithGrantPropagationRetry<TVercelDomain[]>(
    () =>
      deps.listDomains({
        token: env.vercelToken,
        teamId: env.vercelTeamId,
        projectId: env.vercelWebProjectId,
      }),
    retryOptions,
    (error) =>
      new Error(
        `verifyTenantSeededContent: tenant "${tenant.id}"'s domain mapping check against the shared Vercel project failed: ${errorMessage(error)}`,
        { cause: error },
      ),
  );

  if (!domains.some((domain) => domain.name === tenant.primaryDomain)) {
    throw new Error(
      `verifyTenantSeededContent: tenant "${tenant.id}"'s domain "${tenant.primaryDomain}" is not mapped on the shared Vercel project.`,
    );
  }
}
