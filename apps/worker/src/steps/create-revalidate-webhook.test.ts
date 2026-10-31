import { TENANT_PROVISIONING_STATUS } from '@blog/db/constants';
import {
  getTenantRevalidateWebhookSecret,
  setTenantRevalidateWebhookSecret,
  setTenantWebhookCreatedAt,
} from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import {
  createSanityWebhook,
  listSanityWebhooks,
  type TSanityWebhook,
  updateSanityWebhookSecret,
} from '@blog/db/utils/sanity-management-client/sanity-webhooks';
import { faker } from '@faker-js/faker';
import { MOCK_NOW, freezeClock } from '@worker/testing/clock/frozen-clock';
import { MOCK_SANITY_OUTAGE } from '@worker/testing/outage/fixtures';
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
  MOCK_TENANT_MANAGEMENT_TOKEN,
} from '@worker/testing/tenant/fixtures';
import {
  MOCK_CURRENT_WEBHOOK,
  MOCK_OTHER_WEBHOOK,
  MOCK_WEBHOOK_ID,
} from '@worker/testing/webhook/fixtures';

import {
  createTenantRevalidateWebhook,
  revalidateWebhookUrl,
} from './create-revalidate-webhook';

faker.seed(7003);

vi.mock('@blog/db/queries/tenants');
vi.mock('@blog/db/utils/sanity-management-client/sanity-webhooks');
vi.mock('@worker/utils/tenant-management-token/tenant-management-token');

const MOCK_STORED_TENANT_SECRET = faker.string.alphanumeric(32);
const MOCK_ENCRYPTED_SECRET = faker.string.alphanumeric(32);
const MOCK_OTHER_TENANT_ID = faker.string.uuid();
const MOCK_OTHER_PROJECT_ID = faker.string.alphanumeric(8);
const MOCK_SECOND_WEBHOOK_ID = faker.string.uuid();

const { webAppBaseUrl, revalidateSecret } = MOCK_PROVISION_ENV;

function baseTenant(overrides: Partial<TTenant> = {}): TTenant {
  return mockProvisionedTenant({
    sanityReadTokenEncrypted: MOCK_ENCRYPTED_TOKEN,
    provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
    seededAt: MOCK_NOW,
    ...overrides,
  });
}

function givenHooksUntilCreated(before: TSanityWebhook[] = []) {
  vi.mocked(listSanityWebhooks)
    .mockResolvedValueOnce(before)
    .mockResolvedValueOnce([...before, MOCK_CURRENT_WEBHOOK]);
}

function createdWebhook() {
  const [input] = vi.mocked(createSanityWebhook).mock.calls[0] ?? [];
  if (!input) throw new Error('no webhook was created');
  return input;
}

function secretPassedToCreate(): string {
  return createdWebhook().secret;
}

describe(revalidateWebhookUrl, () => {
  it('appends the revalidation route to the base origin', () => {
    expect(revalidateWebhookUrl(webAppBaseUrl)).toBe(
      MOCK_REVALIDATE_WEBHOOK_URL,
    );
  });
});

describe(createTenantRevalidateWebhook, () => {
  beforeEach(() => {
    freezeClock();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('throws when the Sanity project has not been created yet', async () => {
    const tenant = baseTenant({ sanityProjectId: null, sanityDataset: null });

    await expect(
      createTenantRevalidateWebhook(tenant, MOCK_PROVISION_ENV),
    ).rejects.toThrow(/has no Sanity project yet/);
  });

  it('creates the webhook signed with a new secret, stored first', async () => {
    givenHooksUntilCreated();
    vi.mocked(setTenantRevalidateWebhookSecret).mockImplementation(async () => {
      expect(createSanityWebhook).not.toHaveBeenCalled();
    });

    await createTenantRevalidateWebhook(baseTenant(), MOCK_PROVISION_ENV);

    const { name, ...created } = createdWebhook();
    const secret = created.secret;
    const [storedFirst] = vi.mocked(setTenantRevalidateWebhookSecret).mock
      .invocationCallOrder;
    const [createdAfter] =
      vi.mocked(createSanityWebhook).mock.invocationCallOrder;
    expect(secret).not.toBe(revalidateSecret);
    expect(created).toEqual({
      token: MOCK_TENANT_MANAGEMENT_TOKEN,
      projectId: MOCK_SANITY_PROJECT_ID,
      dataset: MOCK_SANITY_DATASET,
      url: MOCK_REVALIDATE_WEBHOOK_URL,
      secret,
    });
    expect(name).not.toBe('');
    expect(setTenantRevalidateWebhookSecret).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      secret,
    );
    expect(storedFirst).toBeLessThan(createdAfter ?? 0);
    expect(setTenantWebhookCreatedAt).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_NOW,
    );
  });

  it.each([
    { case: 'the project has no hooks', before: [] },
    { case: 'its only hook targets an old URL', before: [MOCK_OTHER_WEBHOOK] },
  ])(
    'creates the webhook despite the marker when $case',
    async ({ before }) => {
      givenHooksUntilCreated(before);

      await createTenantRevalidateWebhook(
        baseTenant({ webhookCreatedAt: MOCK_NOW }),
        MOCK_PROVISION_ENV,
      );

      expect(createSanityWebhook).toHaveBeenCalledTimes(1);
    },
  );

  it('throws naming the project when a re-list lacks the created hook', async () => {
    vi.mocked(listSanityWebhooks).mockResolvedValue([]);

    await expect(
      createTenantRevalidateWebhook(baseTenant(), MOCK_PROVISION_ENV),
    ).rejects.toThrow(new RegExp(MOCK_SANITY_PROJECT_ID));
    expect(setTenantWebhookCreatedAt).not.toHaveBeenCalled();
  });

  it('gives two tenants different secrets', async () => {
    givenHooksUntilCreated();
    givenHooksUntilCreated();

    await createTenantRevalidateWebhook(baseTenant(), MOCK_PROVISION_ENV);
    await createTenantRevalidateWebhook(
      baseTenant({
        id: MOCK_OTHER_TENANT_ID,
        sanityProjectId: MOCK_OTHER_PROJECT_ID,
      }),
      MOCK_PROVISION_ENV,
    );

    const [first, second] = vi
      .mocked(createSanityWebhook)
      .mock.calls.map(([input]) => input.secret);
    expect(first).not.toBe(second);
  });

  it('reuses the stored secret when a retry finds the hook still missing', async () => {
    givenHooksUntilCreated();
    vi.mocked(getTenantRevalidateWebhookSecret).mockResolvedValue({
      tenantId: MOCK_TENANT_ID,
      secret: MOCK_STORED_TENANT_SECRET,
    });

    await createTenantRevalidateWebhook(
      baseTenant({ revalidateWebhookSecretEncrypted: MOCK_ENCRYPTED_SECRET }),
      MOCK_PROVISION_ENV,
    );

    expect(secretPassedToCreate()).toBe(MOCK_STORED_TENANT_SECRET);
    expect(setTenantRevalidateWebhookSecret).not.toHaveBeenCalled();
  });

  it("never signs with another tenant's secret stored under the same project", async () => {
    givenHooksUntilCreated();
    vi.mocked(getTenantRevalidateWebhookSecret).mockResolvedValue({
      tenantId: MOCK_OTHER_TENANT_ID,
      secret: MOCK_STORED_TENANT_SECRET,
    });

    await createTenantRevalidateWebhook(baseTenant(), MOCK_PROVISION_ENV);

    expect(secretPassedToCreate()).not.toBe(MOCK_STORED_TENANT_SECRET);
  });

  describe('when the hook exists and its secret is stored', () => {
    const rotatedTenant = {
      revalidateWebhookSecretEncrypted: MOCK_ENCRYPTED_SECRET,
    };

    beforeEach(() => {
      vi.mocked(listSanityWebhooks).mockResolvedValue([MOCK_CURRENT_WEBHOOK]);
    });

    it('changes nothing once the marker is set', async () => {
      await createTenantRevalidateWebhook(
        baseTenant({ ...rotatedTenant, webhookCreatedAt: MOCK_NOW }),
        MOCK_PROVISION_ENV,
      );

      expect(createSanityWebhook).not.toHaveBeenCalled();
      expect(updateSanityWebhookSecret).not.toHaveBeenCalled();
      expect(setTenantRevalidateWebhookSecret).not.toHaveBeenCalled();
      expect(setTenantWebhookCreatedAt).not.toHaveBeenCalled();
    });

    it('sets a missing marker without creating a hook', async () => {
      await createTenantRevalidateWebhook(
        baseTenant(rotatedTenant),
        MOCK_PROVISION_ENV,
      );

      expect(createSanityWebhook).not.toHaveBeenCalled();
      expect(setTenantWebhookCreatedAt).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        MOCK_NOW,
      );
    });
  });

  it('rotates every current hook onto one new secret, then stores it', async () => {
    vi.mocked(listSanityWebhooks).mockResolvedValue([
      MOCK_CURRENT_WEBHOOK,
      { ...MOCK_CURRENT_WEBHOOK, id: MOCK_SECOND_WEBHOOK_ID },
      MOCK_OTHER_WEBHOOK,
    ]);

    await createTenantRevalidateWebhook(
      baseTenant({ webhookCreatedAt: MOCK_NOW }),
      MOCK_PROVISION_ENV,
    );

    const updates = vi
      .mocked(updateSanityWebhookSecret)
      .mock.calls.map(([input]) => input);
    const secret = updates[0]?.secret;
    expect(secret).not.toBe(revalidateSecret);
    expect(updates).toEqual(
      [MOCK_WEBHOOK_ID, MOCK_SECOND_WEBHOOK_ID].map((webhookId) => ({
        token: MOCK_TENANT_MANAGEMENT_TOKEN,
        projectId: MOCK_SANITY_PROJECT_ID,
        webhookId,
        secret,
      })),
    );
    expect(setTenantRevalidateWebhookSecret).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      secret,
    );
    expect(createSanityWebhook).not.toHaveBeenCalled();
  });

  it('stores nothing when updating the hook fails', async () => {
    vi.mocked(listSanityWebhooks).mockResolvedValue([MOCK_CURRENT_WEBHOOK]);
    vi.mocked(updateSanityWebhookSecret).mockRejectedValue(
      new Error(MOCK_SANITY_OUTAGE),
    );

    await expect(
      createTenantRevalidateWebhook(baseTenant(), MOCK_PROVISION_ENV),
    ).rejects.toThrow(MOCK_SANITY_OUTAGE);
    expect(setTenantRevalidateWebhookSecret).not.toHaveBeenCalled();
  });
});
