import { TENANT_STATUS } from '@shinefold/db/constants';
import { listTenants } from '@shinefold/db/queries/tenants';
import { REVALIDATE_WEBHOOK_LOG } from '@worker/constants/revalidate-webhook';
import {
  MOCK_ENCRYPTED_WEBHOOK_SECRET,
  mockTenantWithWebhook,
} from '@worker/testing/tenant/fixtures';
import { runRevalidateWebhookStepForEach } from '@worker/utils/revalidate-webhook-backfill/revalidate-webhook-backfill';

import { syncRevalidateWebhooks } from './sync-revalidate-webhooks';

vi.mock('@shinefold/db/queries/tenants');
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
