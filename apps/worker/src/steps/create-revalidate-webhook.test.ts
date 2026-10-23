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
  MOCK_WEBHOOK_ID,
} from '@worker/testing/webhook/fixtures';

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

const OLD_WEBHOOK_URL = 'https://old.example.com/api/revalidate';
const STORED_TENANT_SECRET = 'tenant-shh';
const ENCRYPTED_SECRET = 'encrypted-shh';
const OTHER_TENANT_ID = 'another-tenant';
const OTHER_PROJECT_ID = 'proj-of-another-tenant';
const SECOND_WEBHOOK_ID = 'webhook-2';
const UPDATE_FAILURE = 'Sanity webhook update failed';

const { sanityManagementToken, webAppBaseUrl, revalidateSecret } =
  MOCK_PROVISION_ENV;
const CURRENT_HOOK = { id: MOCK_WEBHOOK_ID, url: MOCK_REVALIDATE_WEBHOOK_URL };
const OLD_HOOK = { id: MOCK_OTHER_WEBHOOK_ID, url: OLD_WEBHOOK_URL };

function baseTenant(overrides: Partial<TTenant> = {}): TTenant {
  return mockProvisionedTenant({
    sanityReadTokenEncrypted: MOCK_ENCRYPTED_TOKEN,
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
    expect(revalidateWebhookUrl(webAppBaseUrl)).toBe(
      MOCK_REVALIDATE_WEBHOOK_URL,
    );
  });
});

describe(createTenantRevalidateWebhook, () => {
  it('throws when the Sanity project has not been created yet', async () => {
    const tenant = baseTenant({ sanityProjectId: null, sanityDataset: null });

    await expect(
      createTenantRevalidateWebhook(tenant, MOCK_PROVISION_ENV),
    ).rejects.toThrow(/has no Sanity project yet/);
  });

  it('creates the webhook signed with a new secret of its own, stored first', async () => {
    givenHooksUntilCreated();
    setTenantRevalidateWebhookSecretMock.mockImplementation(async () => {
      expect(createSanityWebhookMock).not.toHaveBeenCalled();
    });

    await createTenantRevalidateWebhook(baseTenant(), MOCK_PROVISION_ENV);

    const secret = secretPassedToCreate();
    expect(secret).not.toBe(revalidateSecret);
    expect(createSanityWebhookMock).toHaveBeenCalledWith({
      token: sanityManagementToken,
      projectId: MOCK_SANITY_PROJECT_ID,
      dataset: MOCK_SANITY_DATASET,
      name: expect.any(String),
      url: MOCK_REVALIDATE_WEBHOOK_URL,
      secret,
    });
    expect(setTenantRevalidateWebhookSecretMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      secret,
    );
    expect(setTenantWebhookCreatedAtMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
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
        MOCK_PROVISION_ENV,
      );

      expect(createSanityWebhookMock).toHaveBeenCalledTimes(1);
    },
  );

  it('throws naming the project, without the marker, when a re-list lacks the hook', async () => {
    listSanityWebhooksMock.mockResolvedValue([]);

    await expect(
      createTenantRevalidateWebhook(baseTenant(), MOCK_PROVISION_ENV),
    ).rejects.toThrow(new RegExp(MOCK_SANITY_PROJECT_ID));
    expect(setTenantWebhookCreatedAtMock).not.toHaveBeenCalled();
  });

  it('gives two tenants different secrets', async () => {
    givenHooksUntilCreated();
    givenHooksUntilCreated();

    await createTenantRevalidateWebhook(baseTenant(), MOCK_PROVISION_ENV);
    await createTenantRevalidateWebhook(
      baseTenant({ id: OTHER_TENANT_ID, sanityProjectId: OTHER_PROJECT_ID }),
      MOCK_PROVISION_ENV,
    );

    const [first, second] = createSanityWebhookMock.mock.calls.map(
      ([input]) => input.secret,
    );
    expect(first).not.toBe(second);
  });

  it('reuses the stored secret when a retry finds the hook still missing', async () => {
    givenHooksUntilCreated();
    getTenantRevalidateWebhookSecretMock.mockResolvedValue({
      tenantId: MOCK_TENANT_ID,
      secret: STORED_TENANT_SECRET,
    });

    await createTenantRevalidateWebhook(
      baseTenant({ revalidateWebhookSecretEncrypted: ENCRYPTED_SECRET }),
      MOCK_PROVISION_ENV,
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

    await createTenantRevalidateWebhook(baseTenant(), MOCK_PROVISION_ENV);

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
        MOCK_PROVISION_ENV,
      );

      expect(createSanityWebhookMock).not.toHaveBeenCalled();
      expect(updateSanityWebhookSecretMock).not.toHaveBeenCalled();
      expect(setTenantRevalidateWebhookSecretMock).not.toHaveBeenCalled();
      expect(setTenantWebhookCreatedAtMock).not.toHaveBeenCalled();
    });

    it('sets a missing marker without creating a hook', async () => {
      await createTenantRevalidateWebhook(
        baseTenant(rotatedTenant),
        MOCK_PROVISION_ENV,
      );

      expect(createSanityWebhookMock).not.toHaveBeenCalled();
      expect(setTenantWebhookCreatedAtMock).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        expect.any(Date),
      );
    });
  });

  it('rotates every current hook onto one new secret, then stores it', async () => {
    listSanityWebhooksMock.mockResolvedValue([
      CURRENT_HOOK,
      { id: SECOND_WEBHOOK_ID, url: MOCK_REVALIDATE_WEBHOOK_URL },
      OLD_HOOK,
    ]);

    await createTenantRevalidateWebhook(
      baseTenant({ webhookCreatedAt: new Date() }),
      MOCK_PROVISION_ENV,
    );

    const updates = updateSanityWebhookSecretMock.mock.calls.map(
      ([input]) => input,
    );
    const [{ secret }] = updates;
    expect(secret).not.toBe(revalidateSecret);
    expect(updates).toEqual(
      [MOCK_WEBHOOK_ID, SECOND_WEBHOOK_ID].map((webhookId) => ({
        token: sanityManagementToken,
        projectId: MOCK_SANITY_PROJECT_ID,
        webhookId,
        secret,
      })),
    );
    expect(setTenantRevalidateWebhookSecretMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      secret,
    );
    expect(createSanityWebhookMock).not.toHaveBeenCalled();
  });

  it('stores nothing when updating the hook fails', async () => {
    listSanityWebhooksMock.mockResolvedValue([CURRENT_HOOK]);
    updateSanityWebhookSecretMock.mockRejectedValue(new Error(UPDATE_FAILURE));

    await expect(
      createTenantRevalidateWebhook(baseTenant(), MOCK_PROVISION_ENV),
    ).rejects.toThrow(UPDATE_FAILURE);
    expect(setTenantRevalidateWebhookSecretMock).not.toHaveBeenCalled();
  });
});
