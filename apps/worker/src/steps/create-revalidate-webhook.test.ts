import { TENANT_PROVISIONING_STATUS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { makeTenant, TEST_TENANT_ID } from '@worker/testing/tenant/fixtures';
import type { TProvisionEnv } from '@worker/utils/provision-env/provision-env';

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

const REVALIDATE_WEBHOOK_URL = 'https://example.com/api/revalidate';
const OLD_WEBHOOK_URL = 'https://old.example.com/api/revalidate';
const OTHER_WEBHOOK_URL = 'https://other.example.com/api/revalidate';
const MANAGEMENT_TOKEN = 'mgmt-token';
const WEB_APP_BASE_URL = 'https://example.com';
const REVALIDATE_SECRET = 'revalidate-shh';

const env: TProvisionEnv = {
  sanityManagementToken: MANAGEMENT_TOKEN,
  sanityOrganizationId: 'org-abc',
  vercelToken: 'v-token',
  vercelTeamId: undefined,
  vercelWebProjectId: 'prj_web',
  adminAppBaseUrl: 'https://admin.example.com',
  tenantSanityDataset: 'test-dataset',
  webAppBaseUrl: WEB_APP_BASE_URL,
  revalidateSecret: REVALIDATE_SECRET,
};

function baseTenant(overrides: Partial<TTenant> = {}): TTenant {
  return makeTenant({
    sanityProjectId: 'proj123',
    sanityDataset: 'production',
    sanityReadTokenEncrypted: 'enc',
    provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
    seededAt: new Date(),
    ...overrides,
  });
}

beforeEach(() => {
  setTenantWebhookCreatedAtMock.mockReset();
  listSanityWebhooksMock.mockReset();
  createSanityWebhookMock.mockReset();
});

describe(revalidateWebhookUrl, () => {
  it('appends the revalidation route to the base origin', () => {
    expect(revalidateWebhookUrl(WEB_APP_BASE_URL)).toBe(REVALIDATE_WEBHOOK_URL);
  });
});

describe(createTenantRevalidateWebhook, () => {
  it('creates the webhook when the marker is set but the existing hook targets an old URL', async () => {
    const tenant = baseTenant({ webhookCreatedAt: new Date() });
    listSanityWebhooksMock
      .mockResolvedValueOnce([{ id: 'hook0', url: OLD_WEBHOOK_URL }])
      .mockResolvedValueOnce([
        { id: 'hook0', url: OLD_WEBHOOK_URL },
        { id: 'hook1', url: REVALIDATE_WEBHOOK_URL },
      ]);

    await createTenantRevalidateWebhook(tenant, env);

    expect(createSanityWebhookMock).toHaveBeenCalledWith(
      expect.objectContaining({ url: REVALIDATE_WEBHOOK_URL }),
    );
    expect(setTenantWebhookCreatedAtMock).toHaveBeenCalledWith(
      TEST_TENANT_ID,
      expect.any(Date),
    );
  });

  it('creates the webhook when the marker is set but the project has no hooks', async () => {
    const tenant = baseTenant({ webhookCreatedAt: new Date() });
    listSanityWebhooksMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'hook1', url: REVALIDATE_WEBHOOK_URL }]);

    await createTenantRevalidateWebhook(tenant, env);

    expect(createSanityWebhookMock).toHaveBeenCalledTimes(1);
  });

  it('creates nothing and keeps the marker when the marker is set and the matching hook exists', async () => {
    const tenant = baseTenant({ webhookCreatedAt: new Date() });
    listSanityWebhooksMock.mockResolvedValue([
      { id: 'hook1', url: REVALIDATE_WEBHOOK_URL },
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
        .mockResolvedValueOnce([{ id: 'hook1', url: REVALIDATE_WEBHOOK_URL }]);
      createSanityWebhookMock.mockResolvedValue({
        id: 'hook1',
        url: REVALIDATE_WEBHOOK_URL,
      });

      await createTenantRevalidateWebhook(tenant, env);

      expect(listSanityWebhooksMock).toHaveBeenCalledWith({
        token: MANAGEMENT_TOKEN,
        projectId: 'proj123',
      });
      expect(createSanityWebhookMock).toHaveBeenCalledWith({
        token: MANAGEMENT_TOKEN,
        projectId: 'proj123',
        dataset: 'production',
        name: expect.any(String),
        url: REVALIDATE_WEBHOOK_URL,
        secret: REVALIDATE_SECRET,
      });
      expect(setTenantWebhookCreatedAtMock).toHaveBeenCalledWith(
        TEST_TENANT_ID,
        expect.any(Date),
      );
    });

    it('skips creation but still persists the marker when a matching webhook already exists', async () => {
      listSanityWebhooksMock.mockResolvedValue([
        { id: 'hook1', url: REVALIDATE_WEBHOOK_URL },
      ]);

      await createTenantRevalidateWebhook(tenant, env);

      expect(createSanityWebhookMock).not.toHaveBeenCalled();
      expect(setTenantWebhookCreatedAtMock).toHaveBeenCalledWith(
        TEST_TENANT_ID,
        expect.any(Date),
      );
    });

    it('creates the webhook when existing webhooks point at different URLs', async () => {
      listSanityWebhooksMock
        .mockResolvedValueOnce([{ id: 'hook0', url: OTHER_WEBHOOK_URL }])
        .mockResolvedValueOnce([
          { id: 'hook0', url: OTHER_WEBHOOK_URL },
          { id: 'hook1', url: REVALIDATE_WEBHOOK_URL },
        ]);
      createSanityWebhookMock.mockResolvedValue({
        id: 'hook1',
        url: REVALIDATE_WEBHOOK_URL,
      });

      await createTenantRevalidateWebhook(tenant, env);

      expect(createSanityWebhookMock).toHaveBeenCalledTimes(1);
    });

    it('throws naming the project, without persisting the marker, when the created hook is absent from a re-list', async () => {
      listSanityWebhooksMock.mockResolvedValue([]);
      createSanityWebhookMock.mockResolvedValue({
        id: 'hook1',
        url: REVALIDATE_WEBHOOK_URL,
      });

      await expect(createTenantRevalidateWebhook(tenant, env)).rejects.toThrow(
        /proj123/,
      );
      expect(setTenantWebhookCreatedAtMock).not.toHaveBeenCalled();
    });
  });
});
