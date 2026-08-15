import { setTenantSeededAt } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import { createClient } from '@sanity/client';

import type { TProvisionEnv } from '../lib/env';
import { placeholderPngBuffer } from '../lib/placeholder-image';
import {
  createSanityRobotToken,
  deleteSanityRobotToken,
} from '../lib/sanity-management-client';

import { buildStarterDocuments } from './starter-content';

const SANITY_API_VERSION = '2024-01-01';
const SEED_TOKEN_LABEL = 'provisioning-seed (temporary)';

export type TSeedContentDeps = {
  createClient: typeof createClient;
  mintWriteToken: typeof createSanityRobotToken;
  revokeWriteToken: typeof deleteSanityRobotToken;
};

const defaultDeps: TSeedContentDeps = {
  createClient,
  mintWriteToken: createSanityRobotToken,
  revokeWriteToken: deleteSanityRobotToken,
};

/**
 * Step 2 — seeds the fixed starter content template (singletons + one
 * starter post + navigation, see `starter-content.ts`) into the tenant's
 * brand-new, empty dataset. Uses a transient Editor-scoped Sanity token
 * minted for this run only and revoked immediately after: this dataset has
 * no content yet, so there's no existing write token to reuse, and no
 * reason to leave one lying around once seeding is done.
 *
 * Idempotent: skips entirely once `tenants.seededAt` is set.
 * `createOrReplace` (rather than `create`) also makes a single run safe
 * against a mid-run crash-and-retry that happens before that marker gets
 * persisted.
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
    label: SEED_TOKEN_LABEL,
    role: 'editor',
  });

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
    await transaction.commit();
  } finally {
    await deps.revokeWriteToken({
      token: env.sanityManagementToken,
      projectId: tenant.sanityProjectId,
      robotId: writeToken.id,
    });
  }

  await setTenantSeededAt(tenant.id, new Date());
}
