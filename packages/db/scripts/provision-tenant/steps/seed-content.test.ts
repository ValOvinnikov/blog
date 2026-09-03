import type { TTenant } from '@blog/db/schema/tenants';

import type { TProvisionEnv } from '../lib/env';

import {
  seedTenantContent,
  SEED_TRANSACTION_MAX_ATTEMPTS,
  type TSeedContentDeps,
} from './seed-content';

const {
  setTenantSanityWriteTokenAndSeededAtMock,
  setTenantSanityWriteTokenMock,
  setTenantSeededAtMock,
} = vi.hoisted(() => ({
  setTenantSanityWriteTokenAndSeededAtMock: vi.fn(),
  setTenantSanityWriteTokenMock: vi.fn(),
  setTenantSeededAtMock: vi.fn(),
}));

vi.mock('@blog/db/queries/tenants', () => ({
  setTenantSanityWriteTokenAndSeededAt:
    setTenantSanityWriteTokenAndSeededAtMock,
  setTenantSanityWriteToken: setTenantSanityWriteTokenMock,
  setTenantSeededAt: setTenantSeededAtMock,
}));

const env: TProvisionEnv = {
  sanityManagementToken: 'mgmt-token',
  sanityOrganizationId: 'org-abc',
  vercelToken: 'v-token',
  vercelTeamId: undefined,
  githubRunId: undefined,
  githubRepository: undefined,
  githubServerUrl: undefined,
  tenantRegistryEnvironment: undefined,
  vercelWebProjectId: 'prj_web',
  adminAppBaseUrl: 'https://admin.example.com',
  tenantSanityDataset: 'test-dataset',
  webAppBaseUrl: 'https://example.com',
  revalidateSecret: 'revalidate-shh',
  resendApiKey: undefined,
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
    studioVercelProjectId: null,
    seededAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as TTenant;
}

beforeEach(() => {
  setTenantSanityWriteTokenAndSeededAtMock.mockReset();
  setTenantSanityWriteTokenMock.mockReset();
  setTenantSeededAtMock.mockReset();
});

describe(seedTenantContent, () => {
  it('skips entirely when seededAt is already set', async () => {
    const tenant = baseTenant({ seededAt: new Date() });
    const deps: TSeedContentDeps = {
      createClient: vi.fn(),
      mintWriteToken: vi.fn(),
      revokeWriteToken: vi.fn(),
      sleep: vi.fn().mockResolvedValue(undefined),
    };

    await seedTenantContent(tenant, env, deps);

    expect(deps.mintWriteToken).not.toHaveBeenCalled();
    expect(deps.createClient).not.toHaveBeenCalled();
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

  it('mints an editor token, uploads two images, commits a transaction, and persists the token and seededAt together instead of revoking', async () => {
    const tenant = baseTenant();
    const commit = vi.fn().mockResolvedValue(undefined);
    const createOrReplace = vi.fn();
    const transaction = { createOrReplace, commit };
    const upload = vi
      .fn()
      .mockResolvedValueOnce({ _id: 'image-author' })
      .mockResolvedValueOnce({ _id: 'image-og' });
    const client = { assets: { upload }, transaction: () => transaction };
    const mintWriteToken = vi
      .fn()
      .mockResolvedValue({ id: 'robot-1', token: 'sk-write' });
    const revokeWriteToken = vi.fn().mockResolvedValue(undefined);
    const createClient = vi.fn().mockReturnValue(client);
    const sleep = vi.fn().mockResolvedValue(undefined);

    await seedTenantContent(tenant, env, {
      createClient: createClient as unknown as TSeedContentDeps['createClient'],
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
    expect(upload).toHaveBeenCalledTimes(2);
    expect(createOrReplace).toHaveBeenCalledTimes(9);
    expect(commit).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
    expect(setTenantSanityWriteTokenAndSeededAtMock).toHaveBeenCalledWith(
      'tenant-1',
      'sk-write',
      expect.any(Date),
    );
    expect(revokeWriteToken).not.toHaveBeenCalled();
  });

  it('still revokes the transient token when seeding fails', async () => {
    const tenant = baseTenant();
    const upload = vi.fn().mockRejectedValue(new Error('upload failed'));
    const client = {
      assets: { upload },
      transaction: () => ({ createOrReplace: vi.fn(), commit: vi.fn() }),
    };
    const mintWriteToken = vi
      .fn()
      .mockResolvedValue({ id: 'robot-1', token: 'sk-write' });
    const revokeWriteToken = vi.fn().mockResolvedValue(undefined);
    const createClient = vi.fn().mockReturnValue(client);
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(
      seedTenantContent(tenant, env, {
        createClient:
          createClient as unknown as TSeedContentDeps['createClient'],
        mintWriteToken,
        revokeWriteToken,
        sleep,
      }),
    ).rejects.toThrow('upload failed');

    expect(revokeWriteToken).toHaveBeenCalledWith({
      token: 'mgmt-token',
      projectId: 'proj123',
      robotId: 'robot-1',
    });
    expect(setTenantSanityWriteTokenAndSeededAtMock).not.toHaveBeenCalled();
  });

  it('revokes the token when persisting the token+seededAt fails', async () => {
    const tenant = baseTenant();
    const commit = vi.fn().mockResolvedValue(undefined);
    const createOrReplace = vi.fn();
    const transaction = { createOrReplace, commit };
    const upload = vi
      .fn()
      .mockResolvedValueOnce({ _id: 'image-author' })
      .mockResolvedValueOnce({ _id: 'image-og' });
    const client = { assets: { upload }, transaction: () => transaction };
    const mintWriteToken = vi
      .fn()
      .mockResolvedValue({ id: 'robot-1', token: 'sk-write' });
    const revokeWriteToken = vi.fn().mockResolvedValue(undefined);
    const createClient = vi.fn().mockReturnValue(client);
    const sleep = vi.fn().mockResolvedValue(undefined);
    setTenantSanityWriteTokenAndSeededAtMock.mockRejectedValue(
      new Error('persist failed'),
    );

    await expect(
      seedTenantContent(tenant, env, {
        createClient:
          createClient as unknown as TSeedContentDeps['createClient'],
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

  it('regression: never leaves a live, unrevoked token when persisting the write token succeeds but marking the tenant seeded does not — a crash/retry window that would otherwise orphan a live Editor-scoped token and mint a second one on retry', async () => {
    const tenant = baseTenant();
    const commit = vi.fn().mockResolvedValue(undefined);
    const createOrReplace = vi.fn();
    const transaction = { createOrReplace, commit };
    const upload = vi
      .fn()
      .mockResolvedValueOnce({ _id: 'image-author' })
      .mockResolvedValueOnce({ _id: 'image-og' });
    const client = { assets: { upload }, transaction: () => transaction };
    const mintWriteToken = vi
      .fn()
      .mockResolvedValue({ id: 'robot-1', token: 'sk-write' });
    const revokeWriteToken = vi.fn().mockResolvedValue(undefined);
    const createClient = vi.fn().mockReturnValue(client);
    const sleep = vi.fn().mockResolvedValue(undefined);

    setTenantSanityWriteTokenMock.mockResolvedValue(undefined);
    setTenantSeededAtMock.mockRejectedValue(
      new Error('crashed before marking seeded'),
    );
    setTenantSanityWriteTokenAndSeededAtMock.mockRejectedValue(
      new Error('crashed before marking seeded'),
    );

    await expect(
      seedTenantContent(tenant, env, {
        createClient:
          createClient as unknown as TSeedContentDeps['createClient'],
        mintWriteToken,
        revokeWriteToken,
        sleep,
      }),
    ).rejects.toThrow('crashed before marking seeded');

    expect(revokeWriteToken).toHaveBeenCalledWith({
      token: 'mgmt-token',
      projectId: 'proj123',
      robotId: 'robot-1',
    });
  });

  it('retries a grant-propagation failure once and succeeds without re-uploading assets', async () => {
    const tenant = baseTenant();
    const grantError = new Error(
      'transaction failed: Insufficient permissions; permission "create" required',
    );
    const commit = vi
      .fn()
      .mockRejectedValueOnce(grantError)
      .mockResolvedValueOnce(undefined);
    const createOrReplace = vi.fn();
    const transaction = { createOrReplace, commit };
    const upload = vi
      .fn()
      .mockResolvedValueOnce({ _id: 'image-author' })
      .mockResolvedValueOnce({ _id: 'image-og' });
    const client = { assets: { upload }, transaction: () => transaction };
    const mintWriteToken = vi
      .fn()
      .mockResolvedValue({ id: 'robot-1', token: 'sk-write' });
    const revokeWriteToken = vi.fn().mockResolvedValue(undefined);
    const createClient = vi.fn().mockReturnValue(client);
    const sleep = vi.fn().mockResolvedValue(undefined);

    await seedTenantContent(tenant, env, {
      createClient: createClient as unknown as TSeedContentDeps['createClient'],
      mintWriteToken,
      revokeWriteToken,
      sleep,
    });

    expect(upload).toHaveBeenCalledTimes(2);
    expect(commit).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
    expect(setTenantSanityWriteTokenAndSeededAtMock).toHaveBeenCalledWith(
      'tenant-1',
      'sk-write',
      expect.any(Date),
    );
    expect(revokeWriteToken).not.toHaveBeenCalled();
  });

  it('exhausts retries on a persistent grant-propagation failure, still revokes the token, and never persists it or seededAt', async () => {
    const tenant = baseTenant();
    const grantError = new Error(
      'transaction failed: Insufficient permissions; permission "create" required',
    );
    const commit = vi.fn().mockRejectedValue(grantError);
    const createOrReplace = vi.fn();
    const transaction = { createOrReplace, commit };
    const upload = vi
      .fn()
      .mockResolvedValueOnce({ _id: 'image-author' })
      .mockResolvedValueOnce({ _id: 'image-og' });
    const client = { assets: { upload }, transaction: () => transaction };
    const mintWriteToken = vi
      .fn()
      .mockResolvedValue({ id: 'robot-1', token: 'sk-write' });
    const revokeWriteToken = vi.fn().mockResolvedValue(undefined);
    const createClient = vi.fn().mockReturnValue(client);
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(
      seedTenantContent(tenant, env, {
        createClient:
          createClient as unknown as TSeedContentDeps['createClient'],
        mintWriteToken,
        revokeWriteToken,
        sleep,
      }),
    ).rejects.toThrow(grantError);

    expect(upload).toHaveBeenCalledTimes(2);
    expect(commit).toHaveBeenCalledTimes(SEED_TRANSACTION_MAX_ATTEMPTS);
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
    const transaction = { createOrReplace, commit };
    const upload = vi
      .fn()
      .mockResolvedValueOnce({ _id: 'image-author' })
      .mockResolvedValueOnce({ _id: 'image-og' });
    const client = { assets: { upload }, transaction: () => transaction };
    const mintWriteToken = vi
      .fn()
      .mockResolvedValue({ id: 'robot-1', token: 'sk-write' });
    const revokeWriteToken = vi.fn().mockResolvedValue(undefined);
    const createClient = vi.fn().mockReturnValue(client);
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(
      seedTenantContent(tenant, env, {
        createClient:
          createClient as unknown as TSeedContentDeps['createClient'],
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
