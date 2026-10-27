import { listTenants } from '@blog/db/queries/tenants';
import { faker } from '@faker-js/faker';
import { createTenantRevalidateWebhook } from '@worker/steps/create-revalidate-webhook';
import { MOCK_NOW } from '@worker/testing/clock/frozen-clock';
import { MOCK_SANITY_OUTAGE } from '@worker/testing/outage/fixtures';
import { mockTenant } from '@worker/testing/tenant/fixtures';

import { rotateRevalidateWebhookSecrets } from './rotate-revalidate-webhook-secrets';

vi.mock('@blog/db/queries/tenants');
vi.mock('@worker/utils/provision-env/provision-env');
vi.mock('@worker/steps/create-revalidate-webhook');

faker.seed(7002);

const MOCK_ENCRYPTED_WEBHOOK_SECRET = faker.string.alphanumeric(32);

function provisionedTenant(overrides: Parameters<typeof mockTenant>[0] = {}) {
  return mockTenant({
    id: faker.string.uuid(),
    sanityProjectId: faker.string.alphanumeric(8),
    webhookCreatedAt: MOCK_NOW,
    ...overrides,
  });
}

describe(rotateRevalidateWebhookSecrets, () => {
  it('moves every provisioned tenant without a stored secret onto its own', async () => {
    const first = provisionedTenant();
    const second = provisionedTenant();
    vi.mocked(listTenants).mockResolvedValue([first, second]);

    const summary = await rotateRevalidateWebhookSecrets();

    expect(
      vi.mocked(createTenantRevalidateWebhook).mock.calls.map(([t]) => t),
    ).toEqual([first, second]);
    expect(summary).toEqual({ rotated: [first.id, second.id], failed: [] });
  });

  it.each([
    {
      case: 'is already rotated, so a re-run changes nothing',
      overrides: {
        revalidateWebhookSecretEncrypted: MOCK_ENCRYPTED_WEBHOOK_SECRET,
      },
    },
    { case: 'has no Sanity project', overrides: { sanityProjectId: null } },
    { case: 'has no webhook yet', overrides: { webhookCreatedAt: null } },
  ])('skips a tenant that $case', async ({ overrides }) => {
    vi.mocked(listTenants).mockResolvedValue([provisionedTenant(overrides)]);

    const summary = await rotateRevalidateWebhookSecrets();

    expect(createTenantRevalidateWebhook).not.toHaveBeenCalled();
    expect(summary).toEqual({ rotated: [], failed: [] });
  });

  it('reports a failed tenant and still rotates the rest', async () => {
    const failing = provisionedTenant();
    const healthy = provisionedTenant();
    vi.mocked(listTenants).mockResolvedValue([failing, healthy]);
    vi.mocked(createTenantRevalidateWebhook).mockImplementation(
      async (tenant) => {
        if (tenant.id === failing.id) throw new Error(MOCK_SANITY_OUTAGE);
      },
    );

    const summary = await rotateRevalidateWebhookSecrets();

    expect(summary).toEqual({ rotated: [healthy.id], failed: [failing.id] });
  });
});
