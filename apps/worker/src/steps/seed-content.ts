import {
  buildStarterDocuments,
  type TMaybeNull,
  type TStarterDocumentUnion,
  type TStarterSiteType,
} from '@shinefold/config';
import { setTenantSanityWriteTokenAndSeededAt } from '@shinefold/db/queries/tenants';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { grantPropagationRetryOptions } from '@worker/utils/grant-propagation-retry/grant-propagation-retry';
import {
  buildAppliedMigrationLedger,
  type TMigrationLedger,
} from '@worker/utils/migration-ledger/migration-ledger';
import {
  retryWithBackoff,
  type TRetryWithBackoffOptions,
} from '@worker/utils/retry-with-backoff/retry-with-backoff';
import type { TSeedContentDeps } from '@worker/utils/step-deps/step-deps';
import { withTemporaryWriteToken } from '@worker/utils/temporary-write-token/temporary-write-token';
import type { TTenantSanityClient } from '@worker/utils/tenant-sanity-client/tenant-sanity-client';

export type TAfterSeed = (client: TTenantSanityClient) => Promise<void>;

export type TSeedTenantContentOptions = {
  tenant: TTenant;
  siteType: TStarterSiteType;
  productName: string;
  deps: TSeedContentDeps;
  afterSeed?: TAfterSeed;
};

const SITE_SETTINGS_EXISTS_QUERY = '*[_type == "settings_site"][0]._id';

async function commitStarterContent(
  client: TTenantSanityClient,
  tenant: TTenant,
  siteType: TStarterSiteType,
  retryOptions: TRetryWithBackoffOptions,
): Promise<void> {
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
}

// Idempotent on the dataset's own `settings_site`, never `tenants.seededAt`, so an emptied dataset is re-seeded.
export async function seedTenantContent({
  tenant,
  siteType,
  productName,
  deps,
  afterSeed,
}: TSeedTenantContentOptions): Promise<void> {
  const { id: tenantId, sanityProjectId, sanityDataset } = tenant;
  if (!sanityProjectId || !sanityDataset) {
    throw new Error(
      `seedTenantContent: tenant "${tenantId}" has no Sanity project yet — run the "Create Sanity project" step first.`,
    );
  }

  await withTemporaryWriteToken(
    { tenantId, projectId: sanityProjectId, productName, deps },
    async ({ token, keep }) => {
      const client = deps.createClient({
        projectId: sanityProjectId,
        dataset: sanityDataset,
        token,
      });
      const retryOptions = grantPropagationRetryOptions(deps.sleep);

      const alreadySeeded = await retryWithBackoff(
        () => client.fetch<TMaybeNull<string>>(SITE_SETTINGS_EXISTS_QUERY),
        retryOptions,
      );

      if (!alreadySeeded) {
        await commitStarterContent(client, tenant, siteType, retryOptions);
        await setTenantSanityWriteTokenAndSeededAt(tenantId, token, new Date());
        keep();
      }

      await afterSeed?.(client);
    },
  );
}
