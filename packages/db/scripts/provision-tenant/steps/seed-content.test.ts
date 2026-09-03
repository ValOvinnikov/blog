import type { TTenant } from '@blog/db/schema/tenants';
import { ClientError } from '@sanity/client';

import type { TProvisionEnv } from '../lib/env';

import {
  seedTenantContent,
  SEED_GRANT_RETRY_MAX_ATTEMPTS,
  type TSeedContentDeps,
} from './seed-content';

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

  it('regression: revokes the token when persisting the token+seededAt fails, so a crash/retry window never orphans a live Editor-scoped token or mints a second one on retry', async () => {
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
    expect(commit).toHaveBeenCalledTimes(SEED_GRANT_RETRY_MAX_ATTEMPTS);
    expect(revokeWriteToken).toHaveBeenCalledWith({
      token: 'mgmt-token',
      projectId: 'proj123',
      robotId: 'robot-1',
    });
    expect(setTenantSanityWriteTokenAndSeededAtMock).not.toHaveBeenCalled();
  });

  it('retries an asset upload that fails once on a grant-propagation error, then succeeds, without re-uploading it', async () => {
    const tenant = baseTenant();
    const grantError = new Error(
      'Insufficient permissions; permission "create" required',
    );
    const commit = vi.fn().mockResolvedValue(undefined);
    const createOrReplace = vi.fn();
    const transaction = { createOrReplace, commit };
    let avatarAttempts = 0;
    const upload = vi.fn(
      async (_type: string, _buffer: Buffer, options: { filename: string }) => {
        if (options.filename === 'starter-avatar.png') {
          avatarAttempts += 1;
          if (avatarAttempts === 1) {
            throw grantError;
          }
          return { _id: 'image-author' };
        }
        return { _id: 'image-og' };
      },
    );
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

    expect(avatarAttempts).toBe(2);
    expect(upload).toHaveBeenCalledTimes(3);
    expect(commit).toHaveBeenCalledTimes(1);
    expect(sleep).toHaveBeenCalledTimes(1);
    expect(setTenantSanityWriteTokenAndSeededAtMock).toHaveBeenCalledWith(
      'tenant-1',
      'sk-write',
      expect.any(Date),
    );
    expect(revokeWriteToken).not.toHaveBeenCalled();
  });

  it('exhausts retries when an asset upload keeps hitting a grant-propagation error, still revokes the token, and never sets seededAt', async () => {
    const tenant = baseTenant();
    const grantError = new Error(
      'Insufficient permissions; permission "create" required',
    );
    const commit = vi.fn().mockResolvedValue(undefined);
    const createOrReplace = vi.fn();
    const transaction = { createOrReplace, commit };
    const upload = vi.fn(
      async (_type: string, _buffer: Buffer, options: { filename: string }) => {
        if (options.filename === 'starter-avatar.png') {
          throw grantError;
        }
        return { _id: 'image-og' };
      },
    );
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

    const avatarCalls = upload.mock.calls.filter(
      ([, , options]) => options.filename === 'starter-avatar.png',
    );
    expect(avatarCalls).toHaveLength(SEED_GRANT_RETRY_MAX_ATTEMPTS);
    expect(sleep).toHaveBeenCalledTimes(SEED_GRANT_RETRY_MAX_ATTEMPTS - 1);
    expect(commit).not.toHaveBeenCalled();
    expect(revokeWriteToken).toHaveBeenCalledWith({
      token: 'mgmt-token',
      projectId: 'proj123',
      robotId: 'robot-1',
    });
    expect(setTenantSanityWriteTokenAndSeededAtMock).not.toHaveBeenCalled();
  });

  it('does not retry a non-grant-propagation asset upload failure', async () => {
    const tenant = baseTenant();
    const otherError = new Error('network error');
    const commit = vi.fn().mockResolvedValue(undefined);
    const createOrReplace = vi.fn();
    const transaction = { createOrReplace, commit };
    const upload = vi.fn(
      async (_type: string, _buffer: Buffer, options: { filename: string }) => {
        if (options.filename === 'starter-avatar.png') {
          throw otherError;
        }
        return { _id: 'image-og' };
      },
    );
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

    const avatarCalls = upload.mock.calls.filter(
      ([, , options]) => options.filename === 'starter-avatar.png',
    );
    expect(avatarCalls).toHaveLength(1);
    expect(sleep).not.toHaveBeenCalled();
    expect(commit).not.toHaveBeenCalled();
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
