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
  listSanityWebhooksMock,
  createSanityWebhookMock,
  updateSanityWebhookSecretMock,
} = vi.hoisted(() => ({
  setTenantWebhookCreatedAtMock: vi.fn(),
  getTenantRevalidateWebhookSecretMock: vi.fn(),
  setTenantRevalidateWebhookSecretMock: vi.fn(),
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
const MANAGEMENT_TOKEN = 'mgmt-token';
const WEB_APP_BASE_URL = 'https://example.com';
const REVALIDATE_SECRET = 'revalidate-shh';
const STORED_TENANT_SECRET = 'tenant-shh';
const ENCRYPTED_SECRET = 'encrypted-shh';
const PROJECT_ID = 'proj123';
const DATASET = 'production';
const OTHER_TENANT_ID = 'another-tenant';
const OTHER_PROJECT_ID = 'proj-of-another-tenant';
const HOOK_ID_0 = 'hook0';
const HOOK_ID_1 = 'hook1';
const HOOK_ID_2 = 'hook2';
const UPDATE_FAILURE = 'Sanity webhook update failed';

const CURRENT_HOOK = { id: HOOK_ID_1, url: REVALIDATE_WEBHOOK_URL };
const OLD_HOOK = { id: HOOK_ID_0, url: OLD_WEBHOOK_URL };

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
    sanityDataset: DATASET,
    sanityReadTokenEncrypted: 'enc',
    provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
    seededAt: new Date(),
    ...overrides,
  });
}

function givenHooksUntilCreated(before: { id: string; url: string }[] = []) {
  listSanityWebhooksMock
    .mockResolvedValueOnce(before)
    .mockResolvedValueOnce([...before, CURRENT_HOOK]);
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
  it('throws when the Sanity project has not been created yet', async () => {
    const tenant = baseTenant({ sanityProjectId: null, sanityDataset: null });

    await expect(createTenantRevalidateWebhook(tenant, env)).rejects.toThrow(
      /has no Sanity project yet/,
    );
  });

  it('creates the webhook signed with a new secret of its own, stored first', async () => {
    givenHooksUntilCreated();
    setTenantRevalidateWebhookSecretMock.mockImplementation(async () => {
      expect(createSanityWebhookMock).not.toHaveBeenCalled();
    });

    await createTenantRevalidateWebhook(baseTenant(), env);

    const secret = secretPassedToCreate();
    expect(secret).not.toBe(REVALIDATE_SECRET);
    expect(createSanityWebhookMock).toHaveBeenCalledWith({
      token: MANAGEMENT_TOKEN,
      projectId: PROJECT_ID,
      dataset: DATASET,
      name: expect.any(String),
      url: REVALIDATE_WEBHOOK_URL,
      secret,
    });
    expect(setTenantRevalidateWebhookSecretMock).toHaveBeenCalledWith(
      TEST_TENANT_ID,
      secret,
    );
    expect(setTenantWebhookCreatedAtMock).toHaveBeenCalledWith(
      TEST_TENANT_ID,
      expect.any(Date),
    );
  });

  it.each([
    { case: 'the project has no hooks', before: [] },
    { case: 'its only hook targets an old URL', before: [OLD_HOOK] },
  ])(
    'creates the webhook despite the marker when $case',
    async ({ before }) => {
      givenHooksUntilCreated(before);

      await createTenantRevalidateWebhook(
        baseTenant({ webhookCreatedAt: new Date() }),
        env,
      );

      expect(createSanityWebhookMock).toHaveBeenCalledTimes(1);
    },
  );

  it('throws naming the project, without the marker, when a re-list lacks the hook', async () => {
    listSanityWebhooksMock.mockResolvedValue([]);

    await expect(
      createTenantRevalidateWebhook(baseTenant(), env),
    ).rejects.toThrow(new RegExp(PROJECT_ID));
    expect(setTenantWebhookCreatedAtMock).not.toHaveBeenCalled();
  });

  it('gives two tenants different secrets', async () => {
    givenHooksUntilCreated();
    givenHooksUntilCreated();

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
    givenHooksUntilCreated();
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
    givenHooksUntilCreated();
    getTenantRevalidateWebhookSecretMock.mockResolvedValue({
      tenantId: OTHER_TENANT_ID,
      secret: STORED_TENANT_SECRET,
    });

    await createTenantRevalidateWebhook(baseTenant(), env);

    expect(secretPassedToCreate()).not.toBe(STORED_TENANT_SECRET);
  });

  describe('when the hook exists and its secret is stored', () => {
    const rotatedTenant = {
      revalidateWebhookSecretEncrypted: ENCRYPTED_SECRET,
    };

    beforeEach(() => {
      listSanityWebhooksMock.mockResolvedValue([CURRENT_HOOK]);
    });

    it('changes nothing once the marker is set', async () => {
      await createTenantRevalidateWebhook(
        baseTenant({ ...rotatedTenant, webhookCreatedAt: new Date() }),
        env,
      );

      expect(createSanityWebhookMock).not.toHaveBeenCalled();
      expect(updateSanityWebhookSecretMock).not.toHaveBeenCalled();
      expect(setTenantRevalidateWebhookSecretMock).not.toHaveBeenCalled();
      expect(setTenantWebhookCreatedAtMock).not.toHaveBeenCalled();
    });

    it('sets a missing marker without creating a hook', async () => {
      await createTenantRevalidateWebhook(baseTenant(rotatedTenant), env);

      expect(createSanityWebhookMock).not.toHaveBeenCalled();
      expect(setTenantWebhookCreatedAtMock).toHaveBeenCalledWith(
        TEST_TENANT_ID,
        expect.any(Date),
      );
    });
  });

  it('rotates every current hook onto one new secret, then stores it', async () => {
    listSanityWebhooksMock.mockResolvedValue([
      CURRENT_HOOK,
      { id: HOOK_ID_2, url: REVALIDATE_WEBHOOK_URL },
      OLD_HOOK,
    ]);

    await createTenantRevalidateWebhook(
      baseTenant({ webhookCreatedAt: new Date() }),
      env,
    );

    const updates = updateSanityWebhookSecretMock.mock.calls.map(
      ([input]) => input,
    );
    const [{ secret }] = updates;
    expect(secret).not.toBe(REVALIDATE_SECRET);
    expect(updates).toEqual(
      [HOOK_ID_1, HOOK_ID_2].map((webhookId) => ({
        token: MANAGEMENT_TOKEN,
        projectId: PROJECT_ID,
        webhookId,
        secret,
      })),
    );
    expect(setTenantRevalidateWebhookSecretMock).toHaveBeenCalledWith(
      TEST_TENANT_ID,
      secret,
    );
    expect(createSanityWebhookMock).not.toHaveBeenCalled();
  });

  it('stores nothing when updating the hook fails', async () => {
    listSanityWebhooksMock.mockResolvedValue([CURRENT_HOOK]);
    updateSanityWebhookSecretMock.mockRejectedValue(new Error(UPDATE_FAILURE));

    await expect(
      createTenantRevalidateWebhook(baseTenant(), env),
    ).rejects.toThrow(UPDATE_FAILURE);
    expect(setTenantRevalidateWebhookSecretMock).not.toHaveBeenCalled();
  });
});
