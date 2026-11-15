import { pathToFileURL } from 'node:url';

import { TENANT_STATUS } from '@blog/db/constants';
import { listTenants } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import { REVALIDATE_WEBHOOK_LOG } from '@worker/constants/revalidate-webhook';
import {
  reportRevalidateWebhookBackfill,
  runRevalidateWebhookStepForEach,
  type TRevalidateWebhookBackfillSummary,
} from '@worker/utils/revalidate-webhook-backfill/revalidate-webhook-backfill';

function isLive(tenant: TTenant): boolean {
  return Boolean(
    tenant.sanityProjectId &&
    tenant.webhookCreatedAt &&
    tenant.status !== TENANT_STATUS.ARCHIVED,
  );
}

export async function syncRevalidateWebhooks(): Promise<TRevalidateWebhookBackfillSummary> {
  const live = (await listTenants()).filter(isLive);
  return runRevalidateWebhookStepForEach(
    live,
    REVALIDATE_WEBHOOK_LOG.SYNC_TENANT_FAILED,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  void reportRevalidateWebhookBackfill(syncRevalidateWebhooks, {
    finished: REVALIDATE_WEBHOOK_LOG.SYNC_FINISHED,
    failed: REVALIDATE_WEBHOOK_LOG.SYNC_FAILED,
  });
}
