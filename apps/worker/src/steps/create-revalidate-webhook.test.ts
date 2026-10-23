import { TENANT_PROVISIONING_STATUS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import {
  MOCK_PROVISION_ENV,
  MOCK_REVALIDATE_WEBHOOK_URL,
} from '@worker/testing/provision-env/fake-provision-env';
import {
  MOCK_ENCRYPTED_TOKEN,
  MOCK_SANITY_DATASET,
  MOCK_SANITY_PROJECT_ID,
  MOCK_TENANT_ID,
  mockProvisionedTenant,
} from '@worker/testing/tenant/fixtures';
import {
  MOCK_OTHER_WEBHOOK_ID,
  MOCK_OTHER_WEBHOOK_URL,
  MOCK_WEBHOOK_ID,
} from '@worker/testing/webhook/fixtures';

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

const OLD_WEBHOOK_URL = 'https://old.example.com/api/revalidate';
const { sanityManagementToken, webAppBaseUrl, revalidateSecret } =
  MOCK_PROVISION_ENV;

function baseTenant(overrides: Partial<TTenant> = {}): TTenant {
  return mockProvisionedTenant({
    sanityReadTokenEncrypted: MOCK_ENCRYPTED_TOKEN,
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
    expect(revalidateWebhookUrl(webAppBaseUrl)).toBe(
      MOCK_REVALIDATE_WEBHOOK_URL,
    );
  });
});

describe(createTenantRevalidateWebhook, () => {
  it('creates the webhook when the marker is set but the existing hook targets an old URL', async () => {
    const tenant = baseTenant({ webhookCreatedAt: new Date() });
    listSanityWebhooksMock
      .mockResolvedValueOnce([
        { id: MOCK_OTHER_WEBHOOK_ID, url: OLD_WEBHOOK_URL },
      ])
      .mockResolvedValueOnce([
        { id: MOCK_OTHER_WEBHOOK_ID, url: OLD_WEBHOOK_URL },
        { id: MOCK_WEBHOOK_ID, url: MOCK_REVALIDATE_WEBHOOK_URL },
      ]);

    await createTenantRevalidateWebhook(tenant, MOCK_PROVISION_ENV);

    expect(createSanityWebhookMock).toHaveBeenCalledWith(
      expect.objectContaining({ url: MOCK_REVALIDATE_WEBHOOK_URL }),
    );
    expect(setTenantWebhookCreatedAtMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      expect.any(Date),
    );
  });

  it('creates the webhook when the marker is set but the project has no hooks', async () => {
    const tenant = baseTenant({ webhookCreatedAt: new Date() });
    listSanityWebhooksMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { id: MOCK_WEBHOOK_ID, url: MOCK_REVALIDATE_WEBHOOK_URL },
      ]);

    await createTenantRevalidateWebhook(tenant, MOCK_PROVISION_ENV);

    expect(createSanityWebhookMock).toHaveBeenCalledTimes(1);
  });

  it('creates nothing and keeps the marker when the marker is set and the matching hook exists', async () => {
    const tenant = baseTenant({ webhookCreatedAt: new Date() });
    listSanityWebhooksMock.mockResolvedValue([
      { id: MOCK_WEBHOOK_ID, url: MOCK_REVALIDATE_WEBHOOK_URL },
    ]);

    await createTenantRevalidateWebhook(tenant, MOCK_PROVISION_ENV);

    expect(createSanityWebhookMock).not.toHaveBeenCalled();
    expect(setTenantWebhookCreatedAtMock).not.toHaveBeenCalled();
  });

  it('throws when the Sanity project has not been created yet', async () => {
    const tenant = baseTenant({ sanityProjectId: null, sanityDataset: null });

    await expect(
      createTenantRevalidateWebhook(tenant, MOCK_PROVISION_ENV),
    ).rejects.toThrow(/has no Sanity project yet/);
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
          { id: MOCK_WEBHOOK_ID, url: MOCK_REVALIDATE_WEBHOOK_URL },
        ]);
      createSanityWebhookMock.mockResolvedValue({
        id: MOCK_WEBHOOK_ID,
        url: MOCK_REVALIDATE_WEBHOOK_URL,
      });

      await createTenantRevalidateWebhook(tenant, MOCK_PROVISION_ENV);

      expect(listSanityWebhooksMock).toHaveBeenCalledWith({
        token: sanityManagementToken,
        projectId: MOCK_SANITY_PROJECT_ID,
      });
      expect(createSanityWebhookMock).toHaveBeenCalledWith({
        token: sanityManagementToken,
        projectId: MOCK_SANITY_PROJECT_ID,
        dataset: MOCK_SANITY_DATASET,
        name: expect.any(String),
        url: MOCK_REVALIDATE_WEBHOOK_URL,
        secret: revalidateSecret,
      });
      expect(setTenantWebhookCreatedAtMock).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        expect.any(Date),
      );
    });

    it('skips creation but still persists the marker when a matching webhook already exists', async () => {
      listSanityWebhooksMock.mockResolvedValue([
        { id: MOCK_WEBHOOK_ID, url: MOCK_REVALIDATE_WEBHOOK_URL },
      ]);

      await createTenantRevalidateWebhook(tenant, MOCK_PROVISION_ENV);

      expect(createSanityWebhookMock).not.toHaveBeenCalled();
      expect(setTenantWebhookCreatedAtMock).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        expect.any(Date),
      );
    });

    it('creates the webhook when existing webhooks point at different URLs', async () => {
      listSanityWebhooksMock
        .mockResolvedValueOnce([
          { id: MOCK_OTHER_WEBHOOK_ID, url: MOCK_OTHER_WEBHOOK_URL },
        ])
        .mockResolvedValueOnce([
          { id: MOCK_OTHER_WEBHOOK_ID, url: MOCK_OTHER_WEBHOOK_URL },
          { id: MOCK_WEBHOOK_ID, url: MOCK_REVALIDATE_WEBHOOK_URL },
        ]);
      createSanityWebhookMock.mockResolvedValue({
        id: MOCK_WEBHOOK_ID,
        url: MOCK_REVALIDATE_WEBHOOK_URL,
      });

      await createTenantRevalidateWebhook(tenant, MOCK_PROVISION_ENV);

      expect(createSanityWebhookMock).toHaveBeenCalledTimes(1);
    });

    it('throws naming the project, without persisting the marker, when the created hook is absent from a re-list', async () => {
      listSanityWebhooksMock.mockResolvedValue([]);
      createSanityWebhookMock.mockResolvedValue({
        id: MOCK_WEBHOOK_ID,
        url: MOCK_REVALIDATE_WEBHOOK_URL,
      });

      await expect(
        createTenantRevalidateWebhook(tenant, MOCK_PROVISION_ENV),
      ).rejects.toThrow(/sanity-project-1/);
      expect(setTenantWebhookCreatedAtMock).not.toHaveBeenCalled();
    });
  });
});
