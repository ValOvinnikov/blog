import type { TTenant } from '@blog/db/schema/tenants';

import type { TProvisionEnv } from '../lib/env';

import {
  createTenantRevalidateWebhook,
  revalidateWebhookUrl,
} from './create-revalidate-webhook';

const { setTenantWebhookCreatedAtMock } = vi.hoisted(() => ({
  setTenantWebhookCreatedAtMock: vi.fn(),
}));
const { listSanityWebhooksMock, createSanityWebhookMock } = vi.hoisted(() => ({
  listSanityWebhooksMock: vi.fn(),
  createSanityWebhookMock: vi.fn(),
}));

vi.mock('@blog/db/queries/tenants', () => ({
  setTenantWebhookCreatedAt: setTenantWebhookCreatedAtMock,
}));

vi.mock('../lib/sanity-management-client', () => ({
  listSanityWebhooks: listSanityWebhooksMock,
  createSanityWebhook: createSanityWebhookMock,
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
    sanityReadTokenEncrypted: 'enc',
    locale: 'en',
    plan: 'FREE',
    status: 'ACTIVE',
    provisioningStatus: 'PROVISIONING',
    provisioningSteps: null,
    seededAt: new Date(),
    webhookCreatedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as TTenant;
}

beforeEach(() => {
  setTenantWebhookCreatedAtMock.mockReset();
  listSanityWebhooksMock.mockReset();
  createSanityWebhookMock.mockReset();
});

describe(revalidateWebhookUrl, () => {
  it('appends the revalidation route to the base origin', () => {
    expect(revalidateWebhookUrl('https://example.com')).toBe(
      'https://example.com/api/revalidate',
    );
  });
});

describe(createTenantRevalidateWebhook, () => {
  it('skips entirely when webhookCreatedAt is already set', async () => {
    const tenant = baseTenant({ webhookCreatedAt: new Date() });

    await createTenantRevalidateWebhook(tenant, env);

    expect(listSanityWebhooksMock).not.toHaveBeenCalled();
    expect(createSanityWebhookMock).not.toHaveBeenCalled();
    expect(setTenantWebhookCreatedAtMock).not.toHaveBeenCalled();
  });

  it('throws when the Sanity project has not been created yet', async () => {
    const tenant = baseTenant({ sanityProjectId: null, sanityDataset: null });

    await expect(createTenantRevalidateWebhook(tenant, env)).rejects.toThrow(
      /has no Sanity project yet/,
    );
  });

  it('creates the webhook and persists the marker when none exists yet', async () => {
    const tenant = baseTenant();
    listSanityWebhooksMock.mockResolvedValue([]);
    createSanityWebhookMock.mockResolvedValue({
      id: 'hook1',
      url: 'https://example.com/api/revalidate',
    });

    await createTenantRevalidateWebhook(tenant, env);

    expect(listSanityWebhooksMock).toHaveBeenCalledWith({
      token: 'mgmt-token',
      projectId: 'proj123',
    });
    expect(createSanityWebhookMock).toHaveBeenCalledWith({
      token: 'mgmt-token',
      projectId: 'proj123',
      dataset: 'production',
      name: expect.any(String),
      url: 'https://example.com/api/revalidate',
      secret: 'revalidate-shh',
    });
    expect(setTenantWebhookCreatedAtMock).toHaveBeenCalledWith(
      'tenant-1',
      expect.any(Date),
    );
  });

  it('skips creation but still persists the marker when a matching webhook already exists', async () => {
    const tenant = baseTenant();
    listSanityWebhooksMock.mockResolvedValue([
      { id: 'hook1', url: 'https://example.com/api/revalidate' },
    ]);

    await createTenantRevalidateWebhook(tenant, env);

    expect(createSanityWebhookMock).not.toHaveBeenCalled();
    expect(setTenantWebhookCreatedAtMock).toHaveBeenCalledWith(
      'tenant-1',
      expect.any(Date),
    );
  });

  it('creates the webhook when existing webhooks point at different URLs', async () => {
    const tenant = baseTenant();
    listSanityWebhooksMock.mockResolvedValue([
      { id: 'hook0', url: 'https://other.example.com/api/revalidate' },
    ]);
    createSanityWebhookMock.mockResolvedValue({
      id: 'hook1',
      url: 'https://example.com/api/revalidate',
    });

    await createTenantRevalidateWebhook(tenant, env);

    expect(createSanityWebhookMock).toHaveBeenCalledTimes(1);
  });
});
