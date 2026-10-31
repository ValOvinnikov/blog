import {
  buildStarterDocuments,
  SANITY_ROBOT_ROLE,
  type TMaybeNull,
  type TStarterDocumentUnion,
  type TStarterSiteType,
} from '@blog/config';
import { setTenantSanityWriteTokenAndSeededAt } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import {
  createSanityRobotToken,
  deleteSanityRobotToken,
} from '@blog/db/utils/sanity-management-client/sanity-robot-tokens';
import { buildSanityTokenLabels } from '@blog/db/utils/sanity-management-client/sanity-token-labels';
import { createClient } from '@sanity/client';
import { grantPropagationRetryOptions } from '@worker/utils/grant-propagation-retry/grant-propagation-retry';
import {
  buildAppliedMigrationLedger,
  type TMigrationLedger,
} from '@worker/utils/migration-ledger/migration-ledger';
import { retryWithBackoff } from '@worker/utils/retry-with-backoff/retry-with-backoff';
import { requireTenantManagementToken } from '@worker/utils/tenant-management-token/tenant-management-token';

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

// Idempotent on the dataset's own `settings_site`, never `tenants.seededAt`, so an emptied dataset is re-seeded.
export async function seedTenantContent(
  tenant: TTenant,
  siteType: TStarterSiteType,
  productName: string,
  deps: TSeedContentDeps = defaultDeps,
): Promise<void> {
  if (!tenant.sanityProjectId || !tenant.sanityDataset) {
    throw new Error(
      `seedTenantContent: tenant "${tenant.id}" has no Sanity project yet — run the "Create Sanity project" step first.`,
    );
  }

  const managementToken = await requireTenantManagementToken(tenant.id);
  const writeToken = await deps.mintWriteToken({
    token: managementToken,
    projectId: tenant.sanityProjectId,
    label: buildSanityTokenLabels(productName).write,
    role: SANITY_ROBOT_ROLE.EDITOR,
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
      () => client.fetch<TMaybeNull<string>>(SITE_SETTINGS_EXISTS_QUERY),
      retryOptions,
    );

    if (alreadySeeded) return;

    const now = new Date().toISOString();
    const documents = buildStarterDocuments({
      siteType,
      siteName: tenant.name,
      locale: tenant.locale,
      publishedAt: now,
    });

    const transaction = client.transaction();
    for (const document of documents) {
      transaction.createIfNotExists<TStarterDocumentUnion>(document);
    }
    transaction.createIfNotExists<TMigrationLedger>(
      buildAppliedMigrationLedger(now),
    );

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
        token: managementToken,
        projectId: tenant.sanityProjectId,
        robotId: writeToken.id,
      });
    }
  }
}
