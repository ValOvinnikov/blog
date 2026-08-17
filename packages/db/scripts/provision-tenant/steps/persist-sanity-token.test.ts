import type { TTenant } from '@blog/db/schema/tenants';

import type { TProvisionEnv } from '../lib/env';

import {
  persistTenantSanityToken,
  type TPersistSanityTokenDeps,
} from './persist-sanity-token';

const { setTenantSanityTokenMock } = vi.hoisted(() => ({
  setTenantSanityTokenMock: vi.fn(),
}));

vi.mock('@blog/db/queries/tenants', () => ({
  setTenantSanityToken: setTenantSanityTokenMock,
}));

const env: TProvisionEnv = {
  sanityManagementToken: 'mgmt-token',
  vercelToken: 'v-token',
  vercelOrgId: 'org_1',
  vercelTeamId: undefined,
  vercelWebProjectId: 'prj_web',
  vercelCliVersion: '48.0.0',
  adminAppBaseUrl: 'https://admin.example.com',
  callbackSecret: 'shh',
  platformDomain: 'example.com',
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
  setTenantSanityTokenMock.mockReset();
});

describe(persistTenantSanityToken, () => {
  it('skips minting when a token is already persisted', async () => {
    const tenant = baseTenant({ sanityReadTokenEncrypted: 'already-set' });
    const mintReadToken = vi.fn();

    await persistTenantSanityToken(tenant, env, { mintReadToken });

    expect(mintReadToken).not.toHaveBeenCalled();
    expect(setTenantSanityTokenMock).not.toHaveBeenCalled();
  });

  it('throws when the Sanity project has not been created yet', async () => {
    const tenant = baseTenant({ sanityProjectId: null });
    const mintReadToken = vi.fn();

    await expect(
      persistTenantSanityToken(tenant, env, { mintReadToken }),
    ).rejects.toThrow(/has no Sanity project yet/);
  });

  it('mints a viewer-scoped token and persists it', async () => {
    const tenant = baseTenant();
    const mintReadToken: TPersistSanityTokenDeps['mintReadToken'] = vi
      .fn()
      .mockResolvedValue({ id: 'robot-2', token: 'sk-read' });

    await persistTenantSanityToken(tenant, env, { mintReadToken });

    expect(mintReadToken).toHaveBeenCalledWith({
      token: 'mgmt-token',
      projectId: 'proj123',
      label: expect.any(String),
      role: 'viewer',
    });
    expect(setTenantSanityTokenMock).toHaveBeenCalledWith(
      'tenant-1',
      'sk-read',
    );
  });
});
