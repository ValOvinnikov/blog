import { LOCALE_ISO_CODES } from '@blog/config/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { ClientError } from '@sanity/client';
import type { Mock } from 'vitest';

import type { TProvisionEnv } from '../lib/env';

import { seedTenantContent, type TSeedContentDeps } from './seed-content';
import { buildStarterDocuments } from './starter-content';

const { setTenantSanityWriteTokenAndSeededAtMock } = vi.hoisted(() => ({
  setTenantSanityWriteTokenAndSeededAtMock: vi.fn(),
}));

vi.mock('@blog/db/queries/tenants', () => ({
  setTenantSanityWriteTokenAndSeededAt:
    setTenantSanityWriteTokenAndSeededAtMock,
}));

const env: TProvisionEnv = {
  sanityManagementToken: 'mgmt-token',
  sanityOrganizationId: 'org-abc',
  vercelToken: 'v-token',
  vercelTeamId: undefined,
  githubRunId: undefined,
  githubRepository: undefined,
  githubServerUrl: undefined,
  githubActor: undefined,
  tenantRegistryEnvironment: undefined,
  vercelWebProjectId: 'prj_web',
  adminAppBaseUrl: 'https://admin.example.com',
  tenantSanityDataset: 'test-dataset',
  webAppBaseUrl: 'https://example.com',
  revalidateSecret: 'revalidate-shh',
};

function baseTenant(overrides: Partial<TTenant> = {}): TTenant {
  return {
    id: 'tenant-1',
    name: 'Acme',
    primaryDomain: 'acme.example.com',
    sanityProjectId: 'proj123',
    sanityDataset: 'production',
    sanityReadTokenEncrypted: null,
    locale: LOCALE_ISO_CODES.EN,
    plan: 'FREE',
    status: 'ACTIVE',
    provisioningStatus: 'PROVISIONING',
    provisioningSteps: null,
    seededAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as TTenant;
}

function createClientStub(
  transaction: {
    createOrReplace: ReturnType<typeof vi.fn>;
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
  let createOrReplace: ReturnType<typeof vi.fn>;
  let assetsUpload: ReturnType<typeof vi.fn>;
  let clientFetch: ReturnType<typeof vi.fn>;
  let createClient: TSeedContentDeps['createClient'];
  let mintWriteToken: Mock<TSeedContentDeps['mintWriteToken']>;
  let revokeWriteToken: Mock<TSeedContentDeps['revokeWriteToken']>;
  let sleep: Mock<TSeedContentDeps['sleep']>;

  beforeEach(() => {
    tenant = baseTenant();
    commit = vi.fn().mockResolvedValue(undefined);
    createOrReplace = vi.fn();
    ({
      assetsUpload,
      fetch: clientFetch,
      createClient,
    } = createClientStub({ createOrReplace, commit }));
    mintWriteToken = vi
      .fn()
      .mockResolvedValue({ id: 'robot-1', token: 'sk-write' });
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

    expect(clientFetch).toHaveBeenCalledWith(
      '*[_type == "settings_site"][0]._id',
    );
    expect(createOrReplace).toHaveBeenCalledTimes(
      buildStarterDocuments(seededTenant).length,
    );
    expect(commit).toHaveBeenCalledTimes(1);
    expect(setTenantSanityWriteTokenAndSeededAtMock).toHaveBeenCalledWith(
      'tenant-1',
      'sk-write',
      expect.any(Date),
    );
    expect(revokeWriteToken).not.toHaveBeenCalled();
  });

  it('skips seeding when the dataset already has settings_site', async () => {
    const existingSiteClient = createClientStub(
      { createOrReplace, commit },
      { fetchResult: 'existing-settings-site-id' },
    );

    await seedTenantContent(tenant, env, {
      createClient: existingSiteClient.createClient,
      mintWriteToken,
      revokeWriteToken,
      sleep,
    });

    expect(existingSiteClient.fetch).toHaveBeenCalledWith(
      '*[_type == "settings_site"][0]._id',
    );
    expect(createOrReplace).not.toHaveBeenCalled();
    expect(commit).not.toHaveBeenCalled();
    expect(setTenantSanityWriteTokenAndSeededAtMock).not.toHaveBeenCalled();
    expect(revokeWriteToken).toHaveBeenCalledWith({
      token: 'mgmt-token',
      projectId: 'proj123',
      robotId: 'robot-1',
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
      token: 'mgmt-token',
      projectId: 'proj123',
      label: expect.any(String),
      role: 'editor',
    });
    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'proj123',
        dataset: 'production',
        token: 'sk-write',
        useCdn: false,
      }),
    );
    expect(assetsUpload).not.toHaveBeenCalled();
    expect(createOrReplace).toHaveBeenCalledTimes(
      buildStarterDocuments(tenant).length,
    );
    expect(commit).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
    expect(setTenantSanityWriteTokenAndSeededAtMock).toHaveBeenCalledWith(
      'tenant-1',
      'sk-write',
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

    const committedDocuments = createOrReplace.mock.calls.map(
      ([document]) => document as Record<string, unknown>,
    );
    const site = committedDocuments.find(
      (document) => document._type === 'settings_site',
    );

    expect(site).not.toHaveProperty('defaultOgImage');
  });

  it('still revokes the transient token when seeding fails', async () => {
    commit.mockRejectedValue(new Error('commit failed'));

    await expect(
      seedTenantContent(tenant, env, {
        createClient,
        mintWriteToken,
        revokeWriteToken,
        sleep,
      }),
    ).rejects.toThrow('commit failed');

    expect(revokeWriteToken).toHaveBeenCalledWith({
      token: 'mgmt-token',
      projectId: 'proj123',
      robotId: 'robot-1',
    });
    expect(setTenantSanityWriteTokenAndSeededAtMock).not.toHaveBeenCalled();
  });

  it('regression: revokes the token when persisting the token+seededAt fails, so a crash/retry window never orphans a live Editor-scoped token or mints a second one on retry', async () => {
    setTenantSanityWriteTokenAndSeededAtMock.mockRejectedValue(
      new Error('persist failed'),
    );

    await expect(
      seedTenantContent(tenant, env, {
        createClient,
        mintWriteToken,
        revokeWriteToken,
        sleep,
      }),
    ).rejects.toThrow('persist failed');

    expect(revokeWriteToken).toHaveBeenCalledWith({
      token: 'mgmt-token',
      projectId: 'proj123',
      robotId: 'robot-1',
    });
  });

  it('retries a grant-propagation failure once and succeeds', async () => {
    const grantError = new Error(
      'transaction failed: Insufficient permissions; permission "create" required',
    );
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
      'tenant-1',
      'sk-write',
      expect.any(Date),
    );
    expect(revokeWriteToken).not.toHaveBeenCalled();
  });

  it('retries a structured ClientError carrying the permission-denied status code, even when its message text does not mention "insufficient permissions"', async () => {
    const grantError = new ClientError({
      statusCode: 403,
      headers: {},
      body: { message: 'Forbidden' },
      url: 'https://api.sanity.io/v2024-01-01/data/mutate/test-dataset',
      method: 'POST',
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
      'tenant-1',
      'sk-write',
      expect.any(Date),
    );
    expect(revokeWriteToken).not.toHaveBeenCalled();
  });

  it('does not retry a structured ClientError with an unrelated status code and message', async () => {
    const otherError = new ClientError({
      statusCode: 400,
      headers: {},
      body: { message: 'Malformed mutation' },
      url: 'https://api.sanity.io/v2024-01-01/data/mutate/test-dataset',
      method: 'POST',
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
      token: 'mgmt-token',
      projectId: 'proj123',
      robotId: 'robot-1',
    });
    expect(setTenantSanityWriteTokenAndSeededAtMock).not.toHaveBeenCalled();
  });

  it('exhausts retries on a persistent grant-propagation failure, still revokes the token, and never persists it or seededAt', async () => {
    const grantError = new Error(
      'transaction failed: Insufficient permissions; permission "create" required',
    );
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
      token: 'mgmt-token',
      projectId: 'proj123',
      robotId: 'robot-1',
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
      token: 'mgmt-token',
      projectId: 'proj123',
      robotId: 'robot-1',
    });
    expect(setTenantSanityWriteTokenAndSeededAtMock).not.toHaveBeenCalled();
  });
});
