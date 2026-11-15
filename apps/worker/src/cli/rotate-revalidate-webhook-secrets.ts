import { pathToFileURL } from 'node:url';

import { listTenants } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import { REVALIDATE_WEBHOOK_LOG } from '@worker/constants/revalidate-webhook';
import {
  reportRevalidateWebhookBackfill,
  runRevalidateWebhookStepForEach,
  type TRevalidateWebhookBackfillSummary,
} from '@worker/utils/revalidate-webhook-backfill/revalidate-webhook-backfill';

function isDueForRotation(tenant: TTenant): boolean {
  return Boolean(
    tenant.sanityProjectId &&
    tenant.webhookCreatedAt &&
    !tenant.revalidateWebhookSecretEncrypted,
  );
}

export async function rotateRevalidateWebhookSecrets(): Promise<TRevalidateWebhookBackfillSummary> {
  const due = (await listTenants()).filter(isDueForRotation);
  return runRevalidateWebhookStepForEach(
    due,
    REVALIDATE_WEBHOOK_LOG.ROTATION_TENANT_FAILED,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  void reportRevalidateWebhookBackfill(rotateRevalidateWebhookSecrets, {
    finished: REVALIDATE_WEBHOOK_LOG.ROTATION_FINISHED,
    failed: REVALIDATE_WEBHOOK_LOG.ROTATION_FAILED,
  });
}
