import { listTenants } from '@shinefold/db/queries/tenants';
import { REVALIDATE_WEBHOOK_LOG } from '@worker/constants/revalidate-webhook';
import {
  MOCK_ENCRYPTED_WEBHOOK_SECRET,
  mockTenantWithWebhook,
} from '@worker/testing/tenant/fixtures';
import { runRevalidateWebhookStepForEach } from '@worker/utils/revalidate-webhook-backfill/revalidate-webhook-backfill';

import { rotateRevalidateWebhookSecrets } from './rotate-revalidate-webhook-secrets';

vi.mock('@shinefold/db/queries/tenants');
vi.mock(
  '@worker/utils/revalidate-webhook-backfill/revalidate-webhook-backfill',
);

describe(rotateRevalidateWebhookSecrets, () => {
  it('runs the webhook step for every provisioned tenant without a stored secret only', async () => {
    const due = mockTenantWithWebhook();
    vi.mocked(listTenants).mockResolvedValue([
      due,
      mockTenantWithWebhook({
        revalidateWebhookSecretEncrypted: MOCK_ENCRYPTED_WEBHOOK_SECRET,
      }),
      mockTenantWithWebhook({ sanityProjectId: null }),
      mockTenantWithWebhook({ webhookCreatedAt: null }),
    ]);

    await rotateRevalidateWebhookSecrets();

    expect(runRevalidateWebhookStepForEach).toHaveBeenCalledExactlyOnceWith(
      [due],
      REVALIDATE_WEBHOOK_LOG.ROTATION_TENANT_FAILED,
    );
  });
});
