import { TENANT_PROVISIONING_STATUS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { makeTenant, TEST_TENANT_ID } from '@worker/testing/tenant/fixtures';
import type { TProvisionEnv } from '@worker/utils/provision-env/provision-env';

import {
  createTenantRevalidateWebhook,
  revalidateWebhookUrl,
} from './create-revalidate-webhook';

const {
  setTenantWebhookCreatedAtMock,
  getTenantRevalidateWebhookSecretMock,
  setTenantRevalidateWebhookSecretMock,
} = vi.hoisted(() => ({
  setTenantWebhookCreatedAtMock: vi.fn(),
  getTenantRevalidateWebhookSecretMock: vi.fn(),
  setTenantRevalidateWebhookSecretMock: vi.fn(),
}));
const {
  listSanityWebhooksMock,
  createSanityWebhookMock,
  updateSanityWebhookSecretMock,
} = vi.hoisted(() => ({
  listSanityWebhooksMock: vi.fn(),
  createSanityWebhookMock: vi.fn(),
  updateSanityWebhookSecretMock: vi.fn(),
}));

vi.mock('@blog/db/queries/tenants', () => ({
  setTenantWebhookCreatedAt: setTenantWebhookCreatedAtMock,
  getTenantRevalidateWebhookSecret: getTenantRevalidateWebhookSecretMock,
  setTenantRevalidateWebhookSecret: setTenantRevalidateWebhookSecretMock,
}));

vi.mock('@blog/db/utils/sanity-management-client/sanity-webhooks', () => ({
  listSanityWebhooks: listSanityWebhooksMock,
  createSanityWebhook: createSanityWebhookMock,
  updateSanityWebhookSecret: updateSanityWebhookSecretMock,
}));

const REVALIDATE_WEBHOOK_URL = 'https://example.com/api/revalidate';
const OLD_WEBHOOK_URL = 'https://old.example.com/api/revalidate';
const OTHER_WEBHOOK_URL = 'https://other.example.com/api/revalidate';
const MANAGEMENT_TOKEN = 'mgmt-token';
const WEB_APP_BASE_URL = 'https://example.com';
const REVALIDATE_SECRET = 'revalidate-shh';
const STORED_TENANT_SECRET = 'tenant-shh';
const ENCRYPTED_SECRET = 'encrypted-shh';
const PROJECT_ID = 'proj123';
const OTHER_TENANT_ID = 'another-tenant';
const OTHER_PROJECT_ID = 'proj-of-another-tenant';
const HOOK_ID_0 = 'hook0';
const HOOK_ID_1 = 'hook1';
const HOOK_ID_2 = 'hook2';
const UPDATE_FAILURE = 'Sanity webhook update failed';

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
    sanityProjectId: PROJECT_ID,
    sanityDataset: 'production',
    sanityReadTokenEncrypted: 'enc',
    provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
    seededAt: new Date(),
    ...overrides,
  });
}

function secretPassedToCreate(): string {
  return createSanityWebhookMock.mock.calls[0]?.[0].secret;
}

describe(revalidateWebhookUrl, () => {
  it('appends the revalidation route to the base origin', () => {
    expect(revalidateWebhookUrl(WEB_APP_BASE_URL)).toBe(REVALIDATE_WEBHOOK_URL);
  });
});

describe(createTenantRevalidateWebhook, () => {
  it('creates the webhook when the marker is set but the existing hook targets an old URL', async () => {
    const tenant = baseTenant({ webhookCreatedAt: new Date() });
    listSanityWebhooksMock
      .mockResolvedValueOnce([{ id: HOOK_ID_0, url: OLD_WEBHOOK_URL }])
      .mockResolvedValueOnce([
        { id: HOOK_ID_0, url: OLD_WEBHOOK_URL },
        { id: HOOK_ID_1, url: REVALIDATE_WEBHOOK_URL },
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
      .mockResolvedValueOnce([{ id: HOOK_ID_1, url: REVALIDATE_WEBHOOK_URL }]);

    await createTenantRevalidateWebhook(tenant, env);

    expect(createSanityWebhookMock).toHaveBeenCalledTimes(1);
  });

  it('creates nothing and keeps the marker and secret when the matching hook exists and its secret is stored', async () => {
    const tenant = baseTenant({
      webhookCreatedAt: new Date(),
      revalidateWebhookSecretEncrypted: ENCRYPTED_SECRET,
    });
    listSanityWebhooksMock.mockResolvedValue([
      { id: HOOK_ID_1, url: REVALIDATE_WEBHOOK_URL },
    ]);

    await createTenantRevalidateWebhook(tenant, env);

    expect(createSanityWebhookMock).not.toHaveBeenCalled();
    expect(updateSanityWebhookSecretMock).not.toHaveBeenCalled();
    expect(setTenantRevalidateWebhookSecretMock).not.toHaveBeenCalled();
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
          { id: HOOK_ID_1, url: REVALIDATE_WEBHOOK_URL },
        ]);
      createSanityWebhookMock.mockResolvedValue({
        id: HOOK_ID_1,
        url: REVALIDATE_WEBHOOK_URL,
      });

      await createTenantRevalidateWebhook(tenant, env);

      expect(listSanityWebhooksMock).toHaveBeenCalledWith({
        token: MANAGEMENT_TOKEN,
        projectId: PROJECT_ID,
      });
      expect(createSanityWebhookMock).toHaveBeenCalledWith({
        token: MANAGEMENT_TOKEN,
        projectId: PROJECT_ID,
        dataset: 'production',
        name: expect.any(String),
        url: REVALIDATE_WEBHOOK_URL,
        secret: expect.any(String),
      });
      expect(setTenantWebhookCreatedAtMock).toHaveBeenCalledWith(
        TEST_TENANT_ID,
        expect.any(Date),
      );
    });

    it('skips creation but still persists the marker when a matching webhook already exists', async () => {
      listSanityWebhooksMock.mockResolvedValue([
        { id: HOOK_ID_1, url: REVALIDATE_WEBHOOK_URL },
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
        .mockResolvedValueOnce([{ id: HOOK_ID_0, url: OTHER_WEBHOOK_URL }])
        .mockResolvedValueOnce([
          { id: HOOK_ID_0, url: OTHER_WEBHOOK_URL },
          { id: HOOK_ID_1, url: REVALIDATE_WEBHOOK_URL },
        ]);
      createSanityWebhookMock.mockResolvedValue({
        id: HOOK_ID_1,
        url: REVALIDATE_WEBHOOK_URL,
      });

      await createTenantRevalidateWebhook(tenant, env);

      expect(createSanityWebhookMock).toHaveBeenCalledTimes(1);
    });

    it('throws naming the project, without persisting the marker, when the created hook is absent from a re-list', async () => {
      listSanityWebhooksMock.mockResolvedValue([]);
      createSanityWebhookMock.mockResolvedValue({
        id: HOOK_ID_1,
        url: REVALIDATE_WEBHOOK_URL,
      });

      await expect(createTenantRevalidateWebhook(tenant, env)).rejects.toThrow(
        new RegExp(PROJECT_ID),
      );
      expect(setTenantWebhookCreatedAtMock).not.toHaveBeenCalled();
    });
  });

  describe('per-tenant secret', () => {
    it('signs a new webhook with a freshly generated secret of its own, stored before the hook is created', async () => {
      listSanityWebhooksMock
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { id: HOOK_ID_1, url: REVALIDATE_WEBHOOK_URL },
        ]);
      setTenantRevalidateWebhookSecretMock.mockImplementation(async () => {
        expect(createSanityWebhookMock).not.toHaveBeenCalled();
      });

      await createTenantRevalidateWebhook(baseTenant(), env);

      const secret = secretPassedToCreate();
      expect(secret).not.toBe(REVALIDATE_SECRET);
      expect(setTenantRevalidateWebhookSecretMock).toHaveBeenCalledWith(
        TEST_TENANT_ID,
        secret,
      );
    });

    it('gives two tenants different secrets', async () => {
      listSanityWebhooksMock
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: HOOK_ID_1, url: REVALIDATE_WEBHOOK_URL }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { id: HOOK_ID_2, url: REVALIDATE_WEBHOOK_URL },
        ]);

      await createTenantRevalidateWebhook(baseTenant(), env);
      await createTenantRevalidateWebhook(
        baseTenant({ id: OTHER_TENANT_ID, sanityProjectId: OTHER_PROJECT_ID }),
        env,
      );

      const [first, second] = createSanityWebhookMock.mock.calls.map(
        ([input]) => input.secret,
      );
      expect(first).not.toBe(second);
    });

    it('reuses the stored secret when a retry finds the hook still missing', async () => {
      listSanityWebhooksMock
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { id: HOOK_ID_1, url: REVALIDATE_WEBHOOK_URL },
        ]);
      getTenantRevalidateWebhookSecretMock.mockResolvedValue({
        tenantId: TEST_TENANT_ID,
        secret: STORED_TENANT_SECRET,
      });

      await createTenantRevalidateWebhook(
        baseTenant({ revalidateWebhookSecretEncrypted: ENCRYPTED_SECRET }),
        env,
      );

      expect(secretPassedToCreate()).toBe(STORED_TENANT_SECRET);
      expect(setTenantRevalidateWebhookSecretMock).not.toHaveBeenCalled();
    });

    it("never signs with another tenant's secret stored under the same project", async () => {
      listSanityWebhooksMock
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { id: HOOK_ID_1, url: REVALIDATE_WEBHOOK_URL },
        ]);
      getTenantRevalidateWebhookSecretMock.mockResolvedValue({
        tenantId: OTHER_TENANT_ID,
        secret: STORED_TENANT_SECRET,
      });

      await createTenantRevalidateWebhook(baseTenant(), env);

      expect(secretPassedToCreate()).not.toBe(STORED_TENANT_SECRET);
    });

    it('rotates every existing hook onto one new secret, then stores it, when none is stored', async () => {
      listSanityWebhooksMock.mockResolvedValue([
        { id: HOOK_ID_1, url: REVALIDATE_WEBHOOK_URL },
        { id: HOOK_ID_2, url: REVALIDATE_WEBHOOK_URL },
        { id: HOOK_ID_0, url: OLD_WEBHOOK_URL },
      ]);

      await createTenantRevalidateWebhook(
        baseTenant({ webhookCreatedAt: new Date() }),
        env,
      );

      const updates = updateSanityWebhookSecretMock.mock.calls.map(
        ([input]) => input,
      );
      expect(updates.map(({ webhookId }) => webhookId)).toEqual([
        HOOK_ID_1,
        HOOK_ID_2,
      ]);
      const [{ secret }] = updates;
      expect(secret).not.toBe(REVALIDATE_SECRET);
      expect(updates.every((update) => update.secret === secret)).toBe(true);
      expect(updates[0]).toMatchObject({
        token: MANAGEMENT_TOKEN,
        projectId: PROJECT_ID,
      });
      expect(setTenantRevalidateWebhookSecretMock).toHaveBeenCalledWith(
        TEST_TENANT_ID,
        secret,
      );
      expect(createSanityWebhookMock).not.toHaveBeenCalled();
    });

    it('stores nothing when updating the hook fails', async () => {
      listSanityWebhooksMock.mockResolvedValue([
        { id: HOOK_ID_1, url: REVALIDATE_WEBHOOK_URL },
      ]);
      updateSanityWebhookSecretMock.mockRejectedValue(
        new Error(UPDATE_FAILURE),
      );

      await expect(
        createTenantRevalidateWebhook(baseTenant(), env),
      ).rejects.toThrow(UPDATE_FAILURE);
      expect(setTenantRevalidateWebhookSecretMock).not.toHaveBeenCalled();
    });
  });
});
