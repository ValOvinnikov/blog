import { TENANT_STATUS } from '@blog/db/constants';
import { listTenants } from '@blog/db/queries/tenants';
import { REVALIDATE_WEBHOOK_LOG } from '@worker/constants/revalidate-webhook';
import { mockTenantWithWebhook } from '@worker/testing/tenant/fixtures';
import { MOCK_ENCRYPTED_WEBHOOK_SECRET } from '@worker/testing/webhook/fixtures';
import { runRevalidateWebhookStepForEach } from '@worker/utils/revalidate-webhook-backfill/revalidate-webhook-backfill';

import { syncRevalidateWebhooks } from './sync-revalidate-webhooks';

vi.mock('@blog/db/queries/tenants');
vi.mock(
  '@worker/utils/revalidate-webhook-backfill/revalidate-webhook-backfill',
);

describe(syncRevalidateWebhooks, () => {
  it('runs the webhook step for every live tenant, rotated or not, suspended or not', async () => {
    const live = [
      mockTenantWithWebhook(),
      mockTenantWithWebhook({
        revalidateWebhookSecretEncrypted: MOCK_ENCRYPTED_WEBHOOK_SECRET,
      }),
      mockTenantWithWebhook({ status: TENANT_STATUS.SUSPENDED }),
    ];
    vi.mocked(listTenants).mockResolvedValue([
      ...live,
      mockTenantWithWebhook({ status: TENANT_STATUS.ARCHIVED }),
      mockTenantWithWebhook({ sanityProjectId: null }),
      mockTenantWithWebhook({ webhookCreatedAt: null }),
    ]);

    await syncRevalidateWebhooks();

    expect(runRevalidateWebhookStepForEach).toHaveBeenCalledExactlyOnceWith(
      live,
      REVALIDATE_WEBHOOK_LOG.SYNC_TENANT_FAILED,
    );
  });
});
