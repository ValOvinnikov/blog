import {
  buildStarterDocuments,
  SANITY_ROBOT_ROLE,
  type TStarterSiteType,
} from '@blog/config';
import { SITE_TYPE } from '@blog/config/constants';
import { TENANT_PROVISIONING_STATUS } from '@blog/db/constants';
import { setTenantSanityWriteTokenAndSeededAt } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import { SANITY_WRITE_TOKEN_LABEL } from '@blog/db/utils/sanity-management-client/sanity-token-labels';
import { faker } from '@faker-js/faker';
import { MOCK_NOW, freezeClock } from '@worker/testing/clock/frozen-clock';
import {
  MOCK_DB_DOWN,
  MOCK_SANITY_OUTAGE,
} from '@worker/testing/outage/fixtures';
import { MOCK_PROVISION_ENV } from '@worker/testing/provision-env/fake-provision-env';
import {
  MOCK_INSUFFICIENT_PERMISSIONS_MESSAGE,
  MOCK_MALFORMED_DOCUMENT_MESSAGE,
} from '@worker/testing/sanity-client-error/fixtures';
import {
  MOCK_SANITY_DATASET,
  MOCK_SANITY_PROJECT_ID,
  MOCK_TENANT_ID,
  mockProvisionedTenant,
} from '@worker/testing/tenant/fixtures';
import type { Mock } from 'vitest';

import { seedTenantContent, type TSeedContentDeps } from './seed-content';

faker.seed(7007);

vi.mock('@blog/db/queries/tenants');

const MOCK_WRITE_TOKEN = faker.string.alphanumeric(32);
const MOCK_ROBOT_ID = faker.string.uuid();
const MOCK_EXISTING_SETTINGS_SITE_ID = faker.string.uuid();
const SITE_SETTINGS_QUERY = '*[_type == "settings_site"][0]._id';
const MOCK_REVOKED_TOKEN = {
  token: MOCK_PROVISION_ENV.sanityManagementToken,
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

function createClientStub(
  transaction: {
    createIfNotExists: ReturnType<typeof vi.fn>;
    commit: ReturnType<typeof vi.fn>;
  },
  options: { fetchResult?: string | null } = {},
) {
  const { fetchResult = null } = options;
  const assetsUpload = vi.fn();
  const fetch = vi.fn().mockResolvedValue(fetchResult);
  const client = {
    assets: { upload: assetsUpload },
    fetch,
    transaction: () => transaction,
  };
  return {
    assetsUpload,
    fetch,
    createClient: vi
      .fn()
      .mockReturnValue(client) as unknown as TSeedContentDeps['createClient'],
  };
}

describe(seedTenantContent, () => {
  let tenant: TTenant;
  let commit: ReturnType<typeof vi.fn>;
  let createIfNotExists: ReturnType<typeof vi.fn>;
  let assetsUpload: ReturnType<typeof vi.fn>;
  let clientFetch: ReturnType<typeof vi.fn>;
  let createClient: TSeedContentDeps['createClient'];
  let mintWriteToken: Mock<TSeedContentDeps['mintWriteToken']>;
  let revokeWriteToken: Mock<TSeedContentDeps['revokeWriteToken']>;
  let sleep: Mock<TSeedContentDeps['sleep']>;

  function seed(
    options: {
      tenant?: TTenant;
      siteType?: TStarterSiteType;
      deps?: Partial<TSeedContentDeps>;
    } = {},
  ) {
    const { siteType = SITE_TYPE.BLANK, deps } = options;
    return seedTenantContent(
      options.tenant ?? tenant,
      siteType,
      MOCK_PROVISION_ENV,
      { createClient, mintWriteToken, revokeWriteToken, sleep, ...deps },
    );
  }

  beforeEach(() => {
    freezeClock();
    tenant = baseTenant();
    commit = vi.fn().mockResolvedValue(undefined);
    createIfNotExists = vi.fn();
    ({
      assetsUpload,
      fetch: clientFetch,
      createClient,
    } = createClientStub({ createIfNotExists, commit }));
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

  it('seeds the documents of the site type it is given', async () => {
    await seed({ siteType: SITE_TYPE.BLOG });

    const seededIds = createIfNotExists.mock.calls.map(
      ([document]) => document._id,
    );
    expect(seededIds).toEqual(
      starterDocumentsFor(SITE_TYPE.BLOG, tenant).map(({ _id }) => _id),
    );
  });

  it('skips seeding when the dataset already has settings_site', async () => {
    const existingSiteClient = createClientStub(
      { createIfNotExists, commit },
      { fetchResult: MOCK_EXISTING_SETTINGS_SITE_ID },
    );

    await seed({ deps: { createClient: existingSiteClient.createClient } });

    expect(existingSiteClient.fetch).toHaveBeenCalledWith(SITE_SETTINGS_QUERY);
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

  it('mints an editor token for the tenant project', async () => {
    await seed();

    expect(mintWriteToken).toHaveBeenCalledWith({
      token: MOCK_PROVISION_ENV.sanityManagementToken,
      projectId: MOCK_SANITY_PROJECT_ID,
      label: SANITY_WRITE_TOKEN_LABEL,
      role: SANITY_ROBOT_ROLE.EDITOR,
    });
  });

  it('seeds through a client authenticated with the minted token', async () => {
    await seed();

    const [clientOptions] = vi.mocked(createClient).mock.lastCall ?? [];
    expect(clientOptions?.projectId).toBe(MOCK_SANITY_PROJECT_ID);
    expect(clientOptions?.dataset).toBe(MOCK_SANITY_DATASET);
    expect(clientOptions?.token).toBe(MOCK_WRITE_TOKEN);
    expect(clientOptions?.useCdn).toBe(false);
  });

  it('commits every starter document in one transaction, uploading no assets', async () => {
    await seed();

    expect(assetsUpload).not.toHaveBeenCalled();
    expect(createIfNotExists).toHaveBeenCalledTimes(
      starterDocumentsFor(SITE_TYPE.BLANK, tenant).length,
    );
    expect(commit).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('persists the token and seededAt together instead of revoking', async () => {
    await seed();

    expect(setTenantSanityWriteTokenAndSeededAt).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_WRITE_TOKEN,
      MOCK_NOW,
    );
    expect(revokeWriteToken).not.toHaveBeenCalled();
  });

  it('commits no defaultOgImage on the site settings', async () => {
    await seed();

    const committedDocuments = createIfNotExists.mock.calls.map(
      ([document]) => document as Record<string, unknown>,
    );
    const site = committedDocuments.find(
      (document) => document._type === 'settings_site',
    );

    expect(site).not.toHaveProperty('defaultOgImage');
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
    const grantError = new Error(MOCK_INSUFFICIENT_PERMISSIONS_MESSAGE);
    commit.mockRejectedValueOnce(grantError).mockResolvedValueOnce(undefined);

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
    const grantError = new Error(MOCK_INSUFFICIENT_PERMISSIONS_MESSAGE);
    commit.mockRejectedValue(grantError);

    await expect(seed()).rejects.toThrow(grantError);

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
});
