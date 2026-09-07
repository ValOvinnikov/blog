import type { TTenant } from '@blog/db/schema/tenants';
import { ClientError } from '@sanity/client';

import type { TProvisionEnv } from '../lib/env';
import { GRANT_PROPAGATION_RETRY_MAX_ATTEMPTS } from '../lib/grant-propagation-retry';

import { seedTenantContent, type TSeedContentDeps } from './seed-content';
import { STARTER_DOCUMENT_IDS } from './starter-content';

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
    locale: 'en',
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
  it('seeds when the dataset lacks settings_site even though seededAt is already set', async () => {
    const tenant = baseTenant({ seededAt: new Date() });
    const commit = vi.fn().mockResolvedValue(undefined);
    const createOrReplace = vi.fn();
    const { createClient, fetch } = createClientStub({
      createOrReplace,
      commit,
    });
    const mintWriteToken = vi
      .fn()
      .mockResolvedValue({ id: 'robot-1', token: 'sk-write' });
    const revokeWriteToken = vi.fn().mockResolvedValue(undefined);
    const sleep = vi.fn().mockResolvedValue(undefined);

    await seedTenantContent(tenant, env, {
      createClient,
      mintWriteToken,
      revokeWriteToken,
      sleep,
    });

    expect(fetch).toHaveBeenCalledWith('*[_type == "settings_site"][0]._id');
    expect(createOrReplace).toHaveBeenCalledTimes(
      Object.keys(STARTER_DOCUMENT_IDS).length,
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
    const tenant = baseTenant();
    const commit = vi.fn();
    const createOrReplace = vi.fn();
    const { createClient, fetch } = createClientStub(
      { createOrReplace, commit },
      { fetchResult: STARTER_DOCUMENT_IDS.SITE },
    );
    const mintWriteToken = vi
      .fn()
      .mockResolvedValue({ id: 'robot-1', token: 'sk-write' });
    const revokeWriteToken = vi.fn().mockResolvedValue(undefined);
    const sleep = vi.fn().mockResolvedValue(undefined);

    await seedTenantContent(tenant, env, {
      createClient,
      mintWriteToken,
      revokeWriteToken,
      sleep,
    });

    expect(fetch).toHaveBeenCalledWith('*[_type == "settings_site"][0]._id');
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
    const tenant = baseTenant({ sanityProjectId: null, sanityDataset: null });
    const deps: TSeedContentDeps = {
      createClient: vi.fn(),
      mintWriteToken: vi.fn(),
      revokeWriteToken: vi.fn(),
      sleep: vi.fn().mockResolvedValue(undefined),
    };

    await expect(seedTenantContent(tenant, env, deps)).rejects.toThrow(
      /has no Sanity project yet/,
    );
  });

  it('mints an editor token, uploads no assets, commits a transaction, and persists the token and seededAt together instead of revoking', async () => {
    const tenant = baseTenant();
    const commit = vi.fn().mockResolvedValue(undefined);
    const createOrReplace = vi.fn();
    const { assetsUpload, createClient } = createClientStub({
      createOrReplace,
      commit,
    });
    const mintWriteToken = vi
      .fn()
      .mockResolvedValue({ id: 'robot-1', token: 'sk-write' });
    const revokeWriteToken = vi.fn().mockResolvedValue(undefined);
    const sleep = vi.fn().mockResolvedValue(undefined);

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
      Object.keys(STARTER_DOCUMENT_IDS).length,
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

  it('the committed starter documents contain no image on the author and no defaultOgImage on the site settings', async () => {
    const tenant = baseTenant();
    const commit = vi.fn().mockResolvedValue(undefined);
    const createOrReplace = vi.fn();
    const { createClient } = createClientStub({ createOrReplace, commit });
    const mintWriteToken = vi
      .fn()
      .mockResolvedValue({ id: 'robot-1', token: 'sk-write' });

    await seedTenantContent(tenant, env, {
      createClient,
      mintWriteToken,
      revokeWriteToken: vi.fn().mockResolvedValue(undefined),
      sleep: vi.fn().mockResolvedValue(undefined),
    });

    const committedDocuments = createOrReplace.mock.calls.map(
      ([document]) => document as Record<string, unknown>,
    );
    const author = committedDocuments.find(
      (document) => document._id === STARTER_DOCUMENT_IDS.AUTHOR,
    );
    const site = committedDocuments.find(
      (document) => document._id === STARTER_DOCUMENT_IDS.SITE,
    );

    expect(author).not.toHaveProperty('image');
    expect(site).not.toHaveProperty('defaultOgImage');
  });

  it('still revokes the transient token when seeding fails', async () => {
    const tenant = baseTenant();
    const commit = vi.fn().mockRejectedValue(new Error('commit failed'));
    const { createClient } = createClientStub({
      createOrReplace: vi.fn(),
      commit,
    });
    const mintWriteToken = vi
      .fn()
      .mockResolvedValue({ id: 'robot-1', token: 'sk-write' });
    const revokeWriteToken = vi.fn().mockResolvedValue(undefined);
    const sleep = vi.fn().mockResolvedValue(undefined);

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
    const tenant = baseTenant();
    const commit = vi.fn().mockResolvedValue(undefined);
    const createOrReplace = vi.fn();
    const { createClient } = createClientStub({ createOrReplace, commit });
    const mintWriteToken = vi
      .fn()
      .mockResolvedValue({ id: 'robot-1', token: 'sk-write' });
    const revokeWriteToken = vi.fn().mockResolvedValue(undefined);
    const sleep = vi.fn().mockResolvedValue(undefined);
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
    const tenant = baseTenant();
    const grantError = new Error(
      'transaction failed: Insufficient permissions; permission "create" required',
    );
    const commit = vi
      .fn()
      .mockRejectedValueOnce(grantError)
      .mockResolvedValueOnce(undefined);
    const createOrReplace = vi.fn();
    const { createClient } = createClientStub({ createOrReplace, commit });
    const mintWriteToken = vi
      .fn()
      .mockResolvedValue({ id: 'robot-1', token: 'sk-write' });
    const revokeWriteToken = vi.fn().mockResolvedValue(undefined);
    const sleep = vi.fn().mockResolvedValue(undefined);

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
    const tenant = baseTenant();
    const grantError = new ClientError({
      statusCode: 403,
      headers: {},
      body: { message: 'Forbidden' },
      url: 'https://api.sanity.io/v2024-01-01/data/mutate/test-dataset',
      method: 'POST',
    });
    const commit = vi
      .fn()
      .mockRejectedValueOnce(grantError)
      .mockResolvedValueOnce(undefined);
    const createOrReplace = vi.fn();
    const { createClient } = createClientStub({ createOrReplace, commit });
    const mintWriteToken = vi
      .fn()
      .mockResolvedValue({ id: 'robot-1', token: 'sk-write' });
    const revokeWriteToken = vi.fn().mockResolvedValue(undefined);
    const sleep = vi.fn().mockResolvedValue(undefined);

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
    const tenant = baseTenant();
    const otherError = new ClientError({
      statusCode: 400,
      headers: {},
      body: { message: 'Malformed mutation' },
      url: 'https://api.sanity.io/v2024-01-01/data/mutate/test-dataset',
      method: 'POST',
    });
    const commit = vi.fn().mockRejectedValue(otherError);
    const createOrReplace = vi.fn();
    const { createClient } = createClientStub({ createOrReplace, commit });
    const mintWriteToken = vi
      .fn()
      .mockResolvedValue({ id: 'robot-1', token: 'sk-write' });
    const revokeWriteToken = vi.fn().mockResolvedValue(undefined);
    const sleep = vi.fn().mockResolvedValue(undefined);

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
    const tenant = baseTenant();
    const grantError = new Error(
      'transaction failed: Insufficient permissions; permission "create" required',
    );
    const commit = vi.fn().mockRejectedValue(grantError);
    const createOrReplace = vi.fn();
    const { createClient } = createClientStub({ createOrReplace, commit });
    const mintWriteToken = vi
      .fn()
      .mockResolvedValue({ id: 'robot-1', token: 'sk-write' });
    const revokeWriteToken = vi.fn().mockResolvedValue(undefined);
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(
      seedTenantContent(tenant, env, {
        createClient,
        mintWriteToken,
        revokeWriteToken,
        sleep,
      }),
    ).rejects.toThrow(grantError);

    expect(commit).toHaveBeenCalledTimes(GRANT_PROPAGATION_RETRY_MAX_ATTEMPTS);
    expect(revokeWriteToken).toHaveBeenCalledWith({
      token: 'mgmt-token',
      projectId: 'proj123',
      robotId: 'robot-1',
    });
    expect(setTenantSanityWriteTokenAndSeededAtMock).not.toHaveBeenCalled();
  });

  it('does not retry a non-grant-propagation commit failure', async () => {
    const tenant = baseTenant();
    const otherError = new Error('malformed document');
    const commit = vi.fn().mockRejectedValue(otherError);
    const createOrReplace = vi.fn();
    const { createClient } = createClientStub({ createOrReplace, commit });
    const mintWriteToken = vi
      .fn()
      .mockResolvedValue({ id: 'robot-1', token: 'sk-write' });
    const revokeWriteToken = vi.fn().mockResolvedValue(undefined);
    const sleep = vi.fn().mockResolvedValue(undefined);

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
