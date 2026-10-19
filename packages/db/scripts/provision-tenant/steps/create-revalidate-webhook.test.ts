import { LOCALE_ISO_CODES } from '@blog/config/constants';
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

vi.mock('@blog/db/utils/sanity-management-client/sanity-webhooks', () => ({
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
    locale: LOCALE_ISO_CODES.EN,
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
  it('creates the webhook when the marker is set but the existing hook targets an old URL', async () => {
    const tenant = baseTenant({ webhookCreatedAt: new Date() });
    listSanityWebhooksMock
      .mockResolvedValueOnce([
        { id: 'hook0', url: 'https://old.example.com/api/revalidate' },
      ])
      .mockResolvedValueOnce([
        { id: 'hook0', url: 'https://old.example.com/api/revalidate' },
        { id: 'hook1', url: 'https://example.com/api/revalidate' },
      ]);

    await createTenantRevalidateWebhook(tenant, env);

    expect(createSanityWebhookMock).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://example.com/api/revalidate' }),
    );
    expect(setTenantWebhookCreatedAtMock).toHaveBeenCalledWith(
      'tenant-1',
      expect.any(Date),
    );
  });

  it('creates the webhook when the marker is set but the project has no hooks', async () => {
    const tenant = baseTenant({ webhookCreatedAt: new Date() });
    listSanityWebhooksMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { id: 'hook1', url: 'https://example.com/api/revalidate' },
      ]);

    await createTenantRevalidateWebhook(tenant, env);

    expect(createSanityWebhookMock).toHaveBeenCalledTimes(1);
  });

  it('creates nothing and keeps the marker when the marker is set and the matching hook exists', async () => {
    const tenant = baseTenant({ webhookCreatedAt: new Date() });
    listSanityWebhooksMock.mockResolvedValue([
      { id: 'hook1', url: 'https://example.com/api/revalidate' },
    ]);

    await createTenantRevalidateWebhook(tenant, env);

    expect(createSanityWebhookMock).not.toHaveBeenCalled();
    expect(setTenantWebhookCreatedAtMock).not.toHaveBeenCalled();
  });

  it('throws when the Sanity project has not been created yet', async () => {
    const tenant = baseTenant({ sanityProjectId: null, sanityDataset: null });

    await expect(createTenantRevalidateWebhook(tenant, env)).rejects.toThrow(
      /has no Sanity project yet/,
    );
  });

  describe('for a tenant with a Sanity project', () => {
    let tenant: TTenant;

    beforeEach(() => {
      tenant = baseTenant();
    });

    it('creates the webhook and persists the marker when none exists yet', async () => {
      listSanityWebhooksMock
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { id: 'hook1', url: 'https://example.com/api/revalidate' },
        ]);
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
      listSanityWebhooksMock
        .mockResolvedValueOnce([
          { id: 'hook0', url: 'https://other.example.com/api/revalidate' },
        ])
        .mockResolvedValueOnce([
          { id: 'hook0', url: 'https://other.example.com/api/revalidate' },
          { id: 'hook1', url: 'https://example.com/api/revalidate' },
        ]);
      createSanityWebhookMock.mockResolvedValue({
        id: 'hook1',
        url: 'https://example.com/api/revalidate',
      });

      await createTenantRevalidateWebhook(tenant, env);

      expect(createSanityWebhookMock).toHaveBeenCalledTimes(1);
    });

    it('throws naming the project, without persisting the marker, when the created hook is absent from a re-list', async () => {
      listSanityWebhooksMock.mockResolvedValue([]);
      createSanityWebhookMock.mockResolvedValue({
        id: 'hook1',
        url: 'https://example.com/api/revalidate',
      });

      await expect(createTenantRevalidateWebhook(tenant, env)).rejects.toThrow(
        /proj123/,
      );
      expect(setTenantWebhookCreatedAtMock).not.toHaveBeenCalled();
    });
  });
});
