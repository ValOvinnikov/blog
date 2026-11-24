import { faker } from '@faker-js/faker';
import {
  buildStarterDocuments,
  SANITY_ROBOT_ROLE,
  STUDIO_MIGRATION_IDS,
  type TStarterSiteType,
} from '@shinefold/config';
import { SITE_TYPE } from '@shinefold/config/constants';
import { TENANT_PROVISIONING_STATUS } from '@shinefold/db/constants';
import { setTenantSanityWriteTokenAndSeededAt } from '@shinefold/db/queries/tenants';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { buildSanityTokenLabels } from '@shinefold/db/utils/sanity-management-client/sanity-token-labels';
import { MOCK_NOW, freezeClock } from '@worker/testing/clock/frozen-clock';
import {
  MOCK_DB_DOWN,
  MOCK_SANITY_OUTAGE,
} from '@worker/testing/outage/fixtures';
import { MOCK_PROVISION_ENV } from '@worker/testing/provision-env/fake-provision-env';
import {
  mockSanityClient,
  type TMockSanityClient,
} from '@worker/testing/sanity-client/mock-sanity-client';
import {
  MOCK_INSUFFICIENT_PERMISSIONS_MESSAGE,
  MOCK_MALFORMED_DOCUMENT_MESSAGE,
} from '@worker/testing/sanity-client-error/fixtures';
import {
  MOCK_SANITY_DATASET,
  MOCK_SANITY_PROJECT_ID,
  MOCK_TENANT_ID,
  MOCK_TENANT_MANAGEMENT_TOKEN,
  mockProvisionedTenant,
} from '@worker/testing/tenant/fixtures';
import { buildAppliedMigrationLedger } from '@worker/utils/migration-ledger/migration-ledger';
import type { Mock } from 'vitest';

import {
  seedTenantContent,
  type TAfterSeed,
  type TSeedContentDeps,
} from './seed-content';

faker.seed(7007);

vi.mock('@shinefold/db/queries/tenants');
vi.mock('@worker/utils/tenant-management-token/tenant-management-token');

const MOCK_WRITE_TOKEN = faker.string.alphanumeric(32);
const MOCK_ROBOT_ID = faker.string.uuid();
const MOCK_EXISTING_SETTINGS_SITE_ID = faker.string.uuid();
const SITE_SETTINGS_QUERY = '*[_type == "settings_site"][0]._id';
const MOCK_GRANT_ERROR = new Error(MOCK_INSUFFICIENT_PERMISSIONS_MESSAGE);
const MOCK_REVOKED_TOKEN = {
  token: MOCK_TENANT_MANAGEMENT_TOKEN,
  projectId: MOCK_SANITY_PROJECT_ID,
  robotId: MOCK_ROBOT_ID,
};

function baseTenant(overrides: Partial<TTenant> = {}): TTenant {
  return mockProvisionedTenant({
    provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
    ...overrides,
  });
}

function starterDocumentsFor(siteType: TStarterSiteType, tenant: TTenant) {
  return buildStarterDocuments({
    siteType,
    siteName: tenant.name,
    locale: tenant.locale,
    publishedAt: MOCK_NOW.toISOString(),
  });
}

describe(seedTenantContent, () => {
  let tenant: TTenant;
  let commit: TMockSanityClient['commit'];
  let createIfNotExists: TMockSanityClient['createIfNotExists'];
  let upload: TMockSanityClient['upload'];
  let clientFetch: TMockSanityClient['fetch'];
  let createClient: Mock<TSeedContentDeps['createClient']>;
  let mintWriteToken: Mock<TSeedContentDeps['mintWriteToken']>;
  let revokeWriteToken: Mock<TSeedContentDeps['revokeWriteToken']>;
  let sleep: Mock<TSeedContentDeps['sleep']>;

  function seed(
    options: {
      tenant?: TTenant;
      siteType?: TStarterSiteType;
      deps?: Partial<TSeedContentDeps>;
      afterSeed?: TAfterSeed;
    } = {},
  ) {
    const { siteType = SITE_TYPE.BLANK, deps } = options;
    return seedTenantContent(
      options.tenant ?? tenant,
      siteType,
      MOCK_PROVISION_ENV.productName,
      {
        createClient,
        mintWriteToken,
        revokeWriteToken,
        sleep,
        ...deps,
      },
      options.afterSeed,
    );
  }

  beforeEach(() => {
    freezeClock();
    tenant = baseTenant();
    let client: TMockSanityClient['client'];
    ({
      client,
      upload,
      fetch: clientFetch,
      createIfNotExists,
      commit,
    } = mockSanityClient());
    clientFetch.mockResolvedValue(null);
    commit.mockResolvedValue(undefined);
    createClient = vi
      .fn<TSeedContentDeps['createClient']>()
      .mockReturnValue(client);
    mintWriteToken = vi
      .fn()
      .mockResolvedValue({ id: MOCK_ROBOT_ID, token: MOCK_WRITE_TOKEN });
    revokeWriteToken = vi.fn().mockResolvedValue(undefined);
    sleep = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('seeds when the dataset lacks settings_site though seededAt is set', async () => {
    const seededTenant = baseTenant({ seededAt: MOCK_NOW });

    await seed({ tenant: seededTenant });

    expect(clientFetch).toHaveBeenCalledWith(SITE_SETTINGS_QUERY);
    expect(commit).toHaveBeenCalledTimes(1);
  });

  it('seeds the documents of the site type it is given, then the migration ledger', async () => {
    await seed({ siteType: SITE_TYPE.BLOG });

    const seededIds = createIfNotExists.mock.calls.map(
      ([document]) => document._id,
    );
    expect(seededIds).toEqual([
      ...starterDocumentsFor(SITE_TYPE.BLOG, tenant).map(({ _id }) => _id),
      buildAppliedMigrationLedger(MOCK_NOW.toISOString())._id,
    ]);
  });

  it('skips seeding when the dataset already has settings_site', async () => {
    clientFetch.mockResolvedValue(MOCK_EXISTING_SETTINGS_SITE_ID);

    await seed();

    expect(clientFetch).toHaveBeenCalledWith(SITE_SETTINGS_QUERY);
    expect(createIfNotExists).not.toHaveBeenCalled();
    expect(commit).not.toHaveBeenCalled();
    expect(setTenantSanityWriteTokenAndSeededAt).not.toHaveBeenCalled();
    expect(revokeWriteToken).toHaveBeenCalledWith(MOCK_REVOKED_TOKEN);
  });

  it('throws when the Sanity project has not been created yet', async () => {
    const unprovisionedTenant = baseTenant({
      sanityProjectId: null,
      sanityDataset: null,
    });

    await expect(seed({ tenant: unprovisionedTenant })).rejects.toThrow(
      /has no Sanity project yet/,
    );
  });

  describe('on a fresh dataset', () => {
    beforeEach(async () => {
      await seed();
    });

    it('records every Studio migration as applied in the seed transaction', () => {
      const [ledger] = createIfNotExists.mock.lastCall ?? [];
      expect(ledger.applied.map(({ id }: { id: string }) => id)).toEqual(
        STUDIO_MIGRATION_IDS,
      );
      expect(commit).toHaveBeenCalledTimes(1);
    });

    it('mints an editor token for the tenant project', () => {
      expect(mintWriteToken).toHaveBeenCalledWith({
        token: MOCK_TENANT_MANAGEMENT_TOKEN,
        projectId: MOCK_SANITY_PROJECT_ID,
        label: buildSanityTokenLabels(MOCK_PROVISION_ENV.productName).write,
        role: SANITY_ROBOT_ROLE.EDITOR,
      });
    });

    it('seeds through a client authenticated with the minted token', () => {
      const [clientOptions] = createClient.mock.lastCall ?? [];
      expect(clientOptions?.projectId).toBe(MOCK_SANITY_PROJECT_ID);
      expect(clientOptions?.dataset).toBe(MOCK_SANITY_DATASET);
      expect(clientOptions?.token).toBe(MOCK_WRITE_TOKEN);
      expect(clientOptions?.useCdn).toBe(false);
    });

    it('commits every document and the ledger in one transaction, no assets', () => {
      expect(upload).not.toHaveBeenCalled();
      expect(createIfNotExists).toHaveBeenCalledTimes(
        starterDocumentsFor(SITE_TYPE.BLANK, tenant).length + 1,
      );
      expect(commit).toHaveBeenCalledTimes(1);
      expect(sleep).not.toHaveBeenCalled();
    });

    it('persists the token and seededAt together', () => {
      expect(setTenantSanityWriteTokenAndSeededAt).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        MOCK_WRITE_TOKEN,
        MOCK_NOW,
      );
      expect(revokeWriteToken).not.toHaveBeenCalled();
    });

    it('commits no defaultOgImage on the site settings', () => {
      const committedDocuments = createIfNotExists.mock.calls.map(
        ([document]) => document as Record<string, unknown>,
      );
      const site = committedDocuments.find(
        (document) => document._type === 'settings_site',
      );

      expect(site).not.toHaveProperty('defaultOgImage');
    });
  });

  it('still revokes the transient token when seeding fails', async () => {
    commit.mockRejectedValue(new Error(MOCK_SANITY_OUTAGE));

    await expect(seed()).rejects.toThrow(MOCK_SANITY_OUTAGE);

    expect(revokeWriteToken).toHaveBeenCalledWith(MOCK_REVOKED_TOKEN);
    expect(setTenantSanityWriteTokenAndSeededAt).not.toHaveBeenCalled();
  });

  it('revokes the token when persisting the token and seededAt fails', async () => {
    vi.mocked(setTenantSanityWriteTokenAndSeededAt).mockRejectedValue(
      new Error(MOCK_DB_DOWN),
    );

    await expect(seed()).rejects.toThrow(MOCK_DB_DOWN);

    expect(revokeWriteToken).toHaveBeenCalledWith(MOCK_REVOKED_TOKEN);
  });

  it('retries a grant-propagation failure once and succeeds', async () => {
    commit
      .mockRejectedValueOnce(MOCK_GRANT_ERROR)
      .mockResolvedValueOnce(undefined);

    await seed();

    expect(commit).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
    expect(setTenantSanityWriteTokenAndSeededAt).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_WRITE_TOKEN,
      MOCK_NOW,
    );
    expect(revokeWriteToken).not.toHaveBeenCalled();
  });

  it('revokes the token and persists nothing once grant retries run out', async () => {
    commit.mockRejectedValue(MOCK_GRANT_ERROR);

    await expect(seed()).rejects.toThrow(MOCK_GRANT_ERROR);

    expect(commit.mock.calls.length).toBeGreaterThan(1);
    expect(revokeWriteToken).toHaveBeenCalledWith(MOCK_REVOKED_TOKEN);
    expect(setTenantSanityWriteTokenAndSeededAt).not.toHaveBeenCalled();
  });

  it('does not retry a non-grant-propagation commit failure', async () => {
    const otherError = new Error(MOCK_MALFORMED_DOCUMENT_MESSAGE);
    commit.mockRejectedValue(otherError);

    await expect(seed()).rejects.toThrow(otherError);

    expect(commit).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
    expect(revokeWriteToken).toHaveBeenCalledWith(MOCK_REVOKED_TOKEN);
    expect(setTenantSanityWriteTokenAndSeededAt).not.toHaveBeenCalled();
  });

  describe('with an after-seed step', () => {
    let afterSeed: Mock<TAfterSeed>;

    beforeEach(() => {
      afterSeed = vi.fn().mockResolvedValue(undefined);
    });

    it('runs it on the seeding client once the token is persisted', async () => {
      await seed({ afterSeed });

      expect(afterSeed).toHaveBeenCalledWith(
        createClient.mock.results[0]?.value,
      );
      expect(
        vi.mocked(setTenantSanityWriteTokenAndSeededAt).mock
          .invocationCallOrder[0],
      ).toBeLessThan(afterSeed.mock.invocationCallOrder[0] ?? 0);
    });

    it('runs it on an already-seeded dataset, then revokes the transient token', async () => {
      clientFetch.mockResolvedValue(MOCK_EXISTING_SETTINGS_SITE_ID);

      await seed({ afterSeed });

      expect(afterSeed).toHaveBeenCalledOnce();
      expect(revokeWriteToken).toHaveBeenCalledWith(MOCK_REVOKED_TOKEN);
    });

    it('keeps the persisted token when it fails', async () => {
      afterSeed.mockRejectedValue(new Error(MOCK_SANITY_OUTAGE));

      await expect(seed({ afterSeed })).rejects.toThrow(MOCK_SANITY_OUTAGE);

      expect(revokeWriteToken).not.toHaveBeenCalled();
    });
  });
});
