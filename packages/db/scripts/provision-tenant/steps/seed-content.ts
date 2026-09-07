import { setTenantSanityWriteTokenAndSeededAt } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import {
  createSanityRobotToken,
  deleteSanityRobotToken,
} from '@blog/db/utils/sanity-management-client/sanity-management-client';
import { SANITY_WRITE_TOKEN_LABEL } from '@blog/db/utils/sanity-management-client/sanity-token-labels';
import { createClient } from '@sanity/client';

import type { TProvisionEnv } from '../lib/env';
import { grantPropagationRetryOptions } from '../lib/grant-propagation-retry';
import { retryWithBackoff } from '../lib/retry-with-backoff';

import { buildStarterDocuments } from './starter-content';

const SANITY_API_VERSION = '2024-01-01';

export type TSeedContentDeps = {
  createClient: typeof createClient;
  mintWriteToken: typeof createSanityRobotToken;
  revokeWriteToken: typeof deleteSanityRobotToken;
  sleep: (ms: number) => Promise<void>;
};

const defaultDeps: TSeedContentDeps = {
  createClient,
  mintWriteToken: createSanityRobotToken,
  revokeWriteToken: deleteSanityRobotToken,
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

const SITE_SETTINGS_EXISTS_QUERY = '*[_type == "settings_site"][0]._id';

/**
 * Step 2 — seeds the fixed starter content template (singletons + one
 * starter post + navigation, see `starter-content.ts`) into the tenant's
 * dataset, using an Editor-scoped Sanity token minted for this run.
 *
 * Idempotency is derived from the dataset's own observed state — whether
 * `settings_site` already exists — not from `tenants.seededAt`, so an
 * emptied or recreated dataset is re-seeded on the next run rather than
 * skipped. `createOrReplace` (rather than `create`) also makes a single run
 * safe against a mid-run crash-and-retry that happens before seeding is
 * detectable this way.
 */
export async function seedTenantContent(
  tenant: TTenant,
  env: TProvisionEnv,
  deps: TSeedContentDeps = defaultDeps,
): Promise<void> {
  if (!tenant.sanityProjectId || !tenant.sanityDataset) {
    throw new Error(
      `seedTenantContent: tenant "${tenant.id}" has no Sanity project yet — run the "Create Sanity project" step first.`,
    );
  }

  const writeToken = await deps.mintWriteToken({
    token: env.sanityManagementToken,
    projectId: tenant.sanityProjectId,
    label: SANITY_WRITE_TOKEN_LABEL,
    role: 'editor',
  });

  let persisted = false;

  try {
    const client = deps.createClient({
      projectId: tenant.sanityProjectId,
      dataset: tenant.sanityDataset,
      token: writeToken.token,
      apiVersion: SANITY_API_VERSION,
      useCdn: false,
    });

    const retryOptions = grantPropagationRetryOptions(deps.sleep);

    const alreadySeeded = await retryWithBackoff(
      () => client.fetch<string | null>(SITE_SETTINGS_EXISTS_QUERY),
      retryOptions,
    );

    if (alreadySeeded) return;

    const documents = buildStarterDocuments(tenant);

    const transaction = client.transaction();
    for (const document of documents) {
      transaction.createOrReplace(document);
    }

    await retryWithBackoff(() => transaction.commit(), retryOptions);

    await setTenantSanityWriteTokenAndSeededAt(
      tenant.id,
      writeToken.token,
      new Date(),
    );
    persisted = true;
  } finally {
    if (!persisted) {
      await deps.revokeWriteToken({
        token: env.sanityManagementToken,
        projectId: tenant.sanityProjectId,
        robotId: writeToken.id,
      });
    }
  }
}
