import { setTenantSanityWriteTokenAndSeededAt } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import {
  createSanityRobotToken,
  deleteSanityRobotToken,
} from '@blog/db/utils/sanity-management-client/sanity-management-client';
import { SANITY_WRITE_TOKEN_LABEL } from '@blog/db/utils/sanity-management-client/sanity-token-labels';
import { ClientError, createClient } from '@sanity/client';

import type { TProvisionEnv } from '../lib/env';
import { placeholderPngBuffer } from '../lib/placeholder-image';
import { retryWithBackoff } from '../lib/retry-with-backoff';

import { buildStarterDocuments } from './starter-content';

const SANITY_API_VERSION = '2024-01-01';

// Bounded to ride out a freshly-minted token's grant-propagation delay, not to mask a genuine misconfiguration.
export const SEED_TRANSACTION_MAX_ATTEMPTS = 5;
const SEED_TRANSACTION_BASE_DELAY_MS = 1000;

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

const INSUFFICIENT_PERMISSIONS_STATUS_CODE = 403;

function isGrantPropagationError(error: unknown): boolean {
  if (
    error instanceof ClientError &&
    error.statusCode === INSUFFICIENT_PERMISSIONS_STATUS_CODE
  ) {
    return true;
  }

  return (
    error instanceof Error && /insufficient permissions/i.test(error.message)
  );
}

/**
 * Step 2 — seeds the fixed starter content template (singletons + one
 * starter post + navigation, see `starter-content.ts`) into the tenant's
 * brand-new, empty dataset, using an Editor-scoped Sanity token minted for
 * this run.
 *
 * Idempotent: skips entirely once `tenants.seededAt` is set.
 * `createOrReplace` (rather than `create`) also makes a single run safe
 * against a mid-run crash-and-retry that happens before that marker gets
 * persisted, and safe to retry within a single run once the assets are
 * already uploaded and the transaction already built.
 */
export async function seedTenantContent(
  tenant: TTenant,
  env: TProvisionEnv,
  deps: TSeedContentDeps = defaultDeps,
): Promise<void> {
  if (tenant.seededAt) return;

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

    const [authorImage, ogImage] = await Promise.all([
      client.assets.upload('image', placeholderPngBuffer(), {
        filename: 'starter-avatar.png',
      }),
      client.assets.upload('image', placeholderPngBuffer(), {
        filename: 'starter-og-image.png',
      }),
    ]);

    const documents = buildStarterDocuments(tenant, {
      authorImageAssetId: authorImage._id,
      ogImageAssetId: ogImage._id,
    });

    const transaction = client.transaction();
    for (const document of documents) {
      transaction.createOrReplace(document);
    }

    await retryWithBackoff(() => transaction.commit(), {
      maxAttempts: SEED_TRANSACTION_MAX_ATTEMPTS,
      baseDelayMs: SEED_TRANSACTION_BASE_DELAY_MS,
      isRetryable: isGrantPropagationError,
      sleep: deps.sleep,
    });

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
