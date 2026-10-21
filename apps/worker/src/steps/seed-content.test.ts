import {
  buildStarterDocuments,
  HTTP_METHOD,
  HTTP_STATUS,
  SANITY_ROBOT_ROLE,
} from '@blog/config';
import { SITE_TYPE } from '@blog/config/constants';
import { TENANT_PROVISIONING_STATUS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { ClientError } from '@sanity/client';
import { getProvisionEnv } from '@worker/testing/provision-env/fake-provision-env';
import { makeTenant, TEST_TENANT_ID } from '@worker/testing/tenant/fixtures';
import type { Mock } from 'vitest';

import { seedTenantContent, type TSeedContentDeps } from './seed-content';

const { setTenantSanityWriteTokenAndSeededAtMock } = vi.hoisted(() => ({
  setTenantSanityWriteTokenAndSeededAtMock: vi.fn(),
}));

vi.mock('@blog/db/queries/tenants', () => ({
  setTenantSanityWriteTokenAndSeededAt:
    setTenantSanityWriteTokenAndSeededAtMock,
}));

const env = getProvisionEnv();
const PROJECT_ID = 'proj123';
const DATASET = 'production';
const WRITE_TOKEN = 'sk-write';
const ROBOT_ID = 'robot-1';
const SITE_SETTINGS_QUERY = '*[_type == "settings_site"][0]._id';
const COMMIT_FAILED = 'commit failed';
const PERSIST_FAILED = 'persist failed';
const INSUFFICIENT_PERMISSIONS =
  'transaction failed: Insufficient permissions; permission "create" required';
const MUTATE_URL = `https://api.sanity.io/v2024-01-01/data/mutate/${DATASET}`;

function baseTenant(overrides: Partial<TTenant> = {}): TTenant {
  return makeTenant({
    sanityProjectId: PROJECT_ID,
    sanityDataset: DATASET,
    provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
    ...overrides,
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

beforeEach(() => {
  setTenantSanityWriteTokenAndSeededAtMock.mockReset();
});

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

  beforeEach(() => {
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
      .mockResolvedValue({ id: ROBOT_ID, token: WRITE_TOKEN });
    revokeWriteToken = vi.fn().mockResolvedValue(undefined);
    sleep = vi.fn().mockResolvedValue(undefined);
  });

  it('seeds when the dataset lacks settings_site even though seededAt is already set', async () => {
    const seededTenant = baseTenant({ seededAt: new Date() });

    await seedTenantContent(seededTenant, env, {
      createClient,
      mintWriteToken,
      revokeWriteToken,
      sleep,
    });

    expect(clientFetch).toHaveBeenCalledWith(SITE_SETTINGS_QUERY);
    expect(createIfNotExists).toHaveBeenCalledTimes(
      buildStarterDocuments({
        siteType: SITE_TYPE.BLANK,
        siteName: seededTenant.name,
        locale: seededTenant.locale,
        publishedAt: new Date().toISOString(),
      }).length,
    );
    expect(commit).toHaveBeenCalledTimes(1);
    expect(setTenantSanityWriteTokenAndSeededAtMock).toHaveBeenCalledWith(
      TEST_TENANT_ID,
      WRITE_TOKEN,
      expect.any(Date),
    );
    expect(revokeWriteToken).not.toHaveBeenCalled();
  });

  it('skips seeding when the dataset already has settings_site', async () => {
    const existingSiteClient = createClientStub(
      { createIfNotExists, commit },
      { fetchResult: 'existing-settings-site-id' },
    );

    await seedTenantContent(tenant, env, {
      createClient: existingSiteClient.createClient,
      mintWriteToken,
      revokeWriteToken,
      sleep,
    });

    expect(existingSiteClient.fetch).toHaveBeenCalledWith(SITE_SETTINGS_QUERY);
    expect(createIfNotExists).not.toHaveBeenCalled();
    expect(commit).not.toHaveBeenCalled();
    expect(setTenantSanityWriteTokenAndSeededAtMock).not.toHaveBeenCalled();
    expect(revokeWriteToken).toHaveBeenCalledWith({
      token: env.sanityManagementToken,
      projectId: PROJECT_ID,
      robotId: ROBOT_ID,
    });
  });

  it('throws when the Sanity project has not been created yet', async () => {
    const unprovisionedTenant = baseTenant({
      sanityProjectId: null,
      sanityDataset: null,
    });
    const deps: TSeedContentDeps = {
      createClient: vi.fn(),
      mintWriteToken: vi.fn(),
      revokeWriteToken: vi.fn(),
      sleep: vi.fn().mockResolvedValue(undefined),
    };

    await expect(
      seedTenantContent(unprovisionedTenant, env, deps),
    ).rejects.toThrow(/has no Sanity project yet/);
  });

  it('mints an editor token, uploads no assets, commits a transaction, and persists the token and seededAt together instead of revoking', async () => {
    await seedTenantContent(tenant, env, {
      createClient,
      mintWriteToken,
      revokeWriteToken,
      sleep,
    });

    expect(mintWriteToken).toHaveBeenCalledWith({
      token: env.sanityManagementToken,
      projectId: PROJECT_ID,
      label: expect.any(String),
      role: SANITY_ROBOT_ROLE.EDITOR,
    });
    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: PROJECT_ID,
        dataset: DATASET,
        token: WRITE_TOKEN,
        useCdn: false,
      }),
    );
    expect(assetsUpload).not.toHaveBeenCalled();
    expect(createIfNotExists).toHaveBeenCalledTimes(
      buildStarterDocuments({
        siteType: SITE_TYPE.BLANK,
        siteName: tenant.name,
        locale: tenant.locale,
        publishedAt: new Date().toISOString(),
      }).length,
    );
    expect(commit).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
    expect(setTenantSanityWriteTokenAndSeededAtMock).toHaveBeenCalledWith(
      TEST_TENANT_ID,
      WRITE_TOKEN,
      expect.any(Date),
    );
    expect(revokeWriteToken).not.toHaveBeenCalled();
  });

  it('the committed starter documents contain no defaultOgImage on the site settings', async () => {
    await seedTenantContent(tenant, env, {
      createClient,
      mintWriteToken,
      revokeWriteToken: vi.fn().mockResolvedValue(undefined),
      sleep: vi.fn().mockResolvedValue(undefined),
    });

    const committedDocuments = createIfNotExists.mock.calls.map(
      ([document]) => document as Record<string, unknown>,
    );
    const site = committedDocuments.find(
      (document) => document._type === 'settings_site',
    );

    expect(site).not.toHaveProperty('defaultOgImage');
  });

  it('still revokes the transient token when seeding fails', async () => {
    commit.mockRejectedValue(new Error(COMMIT_FAILED));

    await expect(
      seedTenantContent(tenant, env, {
        createClient,
        mintWriteToken,
        revokeWriteToken,
        sleep,
      }),
    ).rejects.toThrow(COMMIT_FAILED);

    expect(revokeWriteToken).toHaveBeenCalledWith({
      token: env.sanityManagementToken,
      projectId: PROJECT_ID,
      robotId: ROBOT_ID,
    });
    expect(setTenantSanityWriteTokenAndSeededAtMock).not.toHaveBeenCalled();
  });

  it('regression: revokes the token when persisting the token+seededAt fails, so a crash/retry window never orphans a live Editor-scoped token or mints a second one on retry', async () => {
    setTenantSanityWriteTokenAndSeededAtMock.mockRejectedValue(
      new Error(PERSIST_FAILED),
    );

    await expect(
      seedTenantContent(tenant, env, {
        createClient,
        mintWriteToken,
        revokeWriteToken,
        sleep,
      }),
    ).rejects.toThrow(PERSIST_FAILED);

    expect(revokeWriteToken).toHaveBeenCalledWith({
      token: env.sanityManagementToken,
      projectId: PROJECT_ID,
      robotId: ROBOT_ID,
    });
  });

  it('retries a grant-propagation failure once and succeeds', async () => {
    const grantError = new Error(INSUFFICIENT_PERMISSIONS);
    commit.mockRejectedValueOnce(grantError).mockResolvedValueOnce(undefined);

    await seedTenantContent(tenant, env, {
      createClient,
      mintWriteToken,
      revokeWriteToken,
      sleep,
    });

    expect(commit).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
    expect(setTenantSanityWriteTokenAndSeededAtMock).toHaveBeenCalledWith(
      TEST_TENANT_ID,
      WRITE_TOKEN,
      expect.any(Date),
    );
    expect(revokeWriteToken).not.toHaveBeenCalled();
  });

  it('retries a structured ClientError carrying the permission-denied status code, even when its message text does not mention "insufficient permissions"', async () => {
    const grantError = new ClientError({
      statusCode: HTTP_STATUS.FORBIDDEN,
      headers: {},
      body: { message: 'Forbidden' },
      url: MUTATE_URL,
      method: HTTP_METHOD.POST,
    });
    commit.mockRejectedValueOnce(grantError).mockResolvedValueOnce(undefined);

    await seedTenantContent(tenant, env, {
      createClient,
      mintWriteToken,
      revokeWriteToken,
      sleep,
    });

    expect(commit).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
    expect(setTenantSanityWriteTokenAndSeededAtMock).toHaveBeenCalledWith(
      TEST_TENANT_ID,
      WRITE_TOKEN,
      expect.any(Date),
    );
    expect(revokeWriteToken).not.toHaveBeenCalled();
  });

  it('does not retry a structured ClientError with an unrelated status code and message', async () => {
    const otherError = new ClientError({
      statusCode: HTTP_STATUS.BAD_REQUEST,
      headers: {},
      body: { message: 'Malformed mutation' },
      url: MUTATE_URL,
      method: HTTP_METHOD.POST,
    });
    commit.mockRejectedValue(otherError);

    await expect(
      seedTenantContent(tenant, env, {
        createClient,
        mintWriteToken,
        revokeWriteToken,
        sleep,
      }),
    ).rejects.toThrow(otherError);

    expect(commit).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
    expect(revokeWriteToken).toHaveBeenCalledWith({
      token: env.sanityManagementToken,
      projectId: PROJECT_ID,
      robotId: ROBOT_ID,
    });
    expect(setTenantSanityWriteTokenAndSeededAtMock).not.toHaveBeenCalled();
  });

  it('exhausts retries on a persistent grant-propagation failure, still revokes the token, and never persists it or seededAt', async () => {
    const grantError = new Error(INSUFFICIENT_PERMISSIONS);
    commit.mockRejectedValue(grantError);

    await expect(
      seedTenantContent(tenant, env, {
        createClient,
        mintWriteToken,
        revokeWriteToken,
        sleep,
      }),
    ).rejects.toThrow(grantError);

    expect(commit.mock.calls.length).toBeGreaterThan(1);
    expect(revokeWriteToken).toHaveBeenCalledWith({
      token: env.sanityManagementToken,
      projectId: PROJECT_ID,
      robotId: ROBOT_ID,
    });
    expect(setTenantSanityWriteTokenAndSeededAtMock).not.toHaveBeenCalled();
  });

  it('does not retry a non-grant-propagation commit failure', async () => {
    const otherError = new Error('malformed document');
    commit.mockRejectedValue(otherError);

    await expect(
      seedTenantContent(tenant, env, {
        createClient,
        mintWriteToken,
        revokeWriteToken,
        sleep,
      }),
    ).rejects.toThrow(otherError);

    expect(commit).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
    expect(revokeWriteToken).toHaveBeenCalledWith({
      token: env.sanityManagementToken,
      projectId: PROJECT_ID,
      robotId: ROBOT_ID,
    });
    expect(setTenantSanityWriteTokenAndSeededAtMock).not.toHaveBeenCalled();
  });
});
