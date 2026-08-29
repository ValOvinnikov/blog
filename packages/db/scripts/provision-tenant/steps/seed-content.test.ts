import type { TTenant } from '@blog/db/schema/tenants';

import type { TProvisionEnv } from '../lib/env';

import { seedTenantContent, type TSeedContentDeps } from './seed-content';

const { setTenantSeededAtMock } = vi.hoisted(() => ({
  setTenantSeededAtMock: vi.fn(),
}));

vi.mock('@blog/db/queries/tenants', () => ({
  setTenantSeededAt: setTenantSeededAtMock,
}));

const env: TProvisionEnv = {
  sanityManagementToken: 'mgmt-token',
  sanityOrganizationId: 'org-abc',
  vercelToken: 'v-token',
  vercelTeamId: undefined,
  vercelWebProjectId: 'prj_web',
  adminAppBaseUrl: 'https://admin.example.com',
  tenantSanityDataset: 'test-dataset',
  webAppBaseUrl: 'https://example.com',
  revalidateSecret: 'revalidate-shh',
};

function baseTenant(overrides: Partial<TTenant> = {}): TTenant {
  return {
    id: 'tenant-1',
    slug: 'acme',
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
  setTenantSeededAtMock.mockReset();
});

describe(seedTenantContent, () => {
  it('skips entirely when seededAt is already set', async () => {
    const tenant = baseTenant({ seededAt: new Date() });
    const deps: TSeedContentDeps = {
      createClient: vi.fn(),
      mintWriteToken: vi.fn(),
      revokeWriteToken: vi.fn(),
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
    };

    await expect(seedTenantContent(tenant, env, deps)).rejects.toThrow(
      /has no Sanity project yet/,
    );
  });

  it('mints a transient editor token, uploads two images, commits a transaction, revokes the token, and persists seededAt', async () => {
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

    await seedTenantContent(tenant, env, {
      createClient: createClient as unknown as TSeedContentDeps['createClient'],
      mintWriteToken,
      revokeWriteToken,
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
    expect(revokeWriteToken).toHaveBeenCalledWith({
      token: 'mgmt-token',
      projectId: 'proj123',
      robotId: 'robot-1',
    });
    expect(setTenantSeededAtMock).toHaveBeenCalledWith(
      'tenant-1',
      expect.any(Date),
    );
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

    await expect(
      seedTenantContent(tenant, env, {
        createClient:
          createClient as unknown as TSeedContentDeps['createClient'],
        mintWriteToken,
        revokeWriteToken,
      }),
    ).rejects.toThrow('upload failed');

    expect(revokeWriteToken).toHaveBeenCalledWith({
      token: 'mgmt-token',
      projectId: 'proj123',
      robotId: 'robot-1',
    });
    expect(setTenantSeededAtMock).not.toHaveBeenCalled();
  });
});
