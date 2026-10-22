import { listTenants } from '@blog/db/queries/tenants';
import { faker } from '@faker-js/faker';
import { createTenantRevalidateWebhook } from '@worker/steps/create-revalidate-webhook';
import { makeTenant } from '@worker/testing/tenant/fixtures';

import { rotateRevalidateWebhookSecrets } from './rotate-revalidate-webhook-secrets';

vi.mock(import('@blog/db/queries/tenants'), async (importOriginal) =>
  (
    await import('@worker/testing/tenants-queries/fake-tenants-queries')
  ).withFakeTenantsQueries(await importOriginal()),
);
vi.mock(
  '@worker/utils/provision-env/provision-env',
  () => import('@worker/testing/provision-env/fake-provision-env'),
);
vi.mock('@worker/steps/create-revalidate-webhook');

const ENCRYPTED_SECRET = 'encrypted-secret';

function provisionedTenant(overrides: Parameters<typeof makeTenant>[0] = {}) {
  return makeTenant({
    id: faker.string.uuid(),
    sanityProjectId: faker.string.alphanumeric(8),
    webhookCreatedAt: new Date(),
    ...overrides,
  });
}

describe(rotateRevalidateWebhookSecrets, () => {
  it('moves every provisioned tenant without a stored secret onto its own', async () => {
    const first = provisionedTenant();
    const second = provisionedTenant();
    vi.mocked(listTenants).mockResolvedValue([first, second]);

    const summary = await rotateRevalidateWebhookSecrets();

    expect(createTenantRevalidateWebhook).toHaveBeenCalledWith(
      first,
      expect.anything(),
    );
    expect(createTenantRevalidateWebhook).toHaveBeenCalledWith(
      second,
      expect.anything(),
    );
    expect(summary).toEqual({ rotated: [first.id, second.id], failed: [] });
  });

  it('skips tenants already rotated, so a re-run changes nothing', async () => {
    vi.mocked(listTenants).mockResolvedValue([
      provisionedTenant({ revalidateWebhookSecretEncrypted: ENCRYPTED_SECRET }),
    ]);

    const summary = await rotateRevalidateWebhookSecrets();

    expect(createTenantRevalidateWebhook).not.toHaveBeenCalled();
    expect(summary).toEqual({ rotated: [], failed: [] });
  });

  it('skips tenants whose provisioning has not reached the webhook', async () => {
    vi.mocked(listTenants).mockResolvedValue([
      provisionedTenant({ sanityProjectId: null }),
      provisionedTenant({ webhookCreatedAt: null }),
    ]);

    await rotateRevalidateWebhookSecrets();

    expect(createTenantRevalidateWebhook).not.toHaveBeenCalled();
  });

  it('reports a failed tenant and still rotates the rest', async () => {
    const failing = provisionedTenant();
    const healthy = provisionedTenant();
    vi.mocked(listTenants).mockResolvedValue([failing, healthy]);
    vi.mocked(createTenantRevalidateWebhook).mockImplementation(
      async (tenant) => {
        if (tenant.id === failing.id) throw new Error('Sanity said no');
      },
    );

    const summary = await rotateRevalidateWebhookSecrets();

    expect(summary).toEqual({ rotated: [healthy.id], failed: [failing.id] });
  });
});
