import type { TValueOf } from '@shinefold/config/utils';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { sanitizeLogMessage } from '@shinefold/insight';
import { hasLength } from '@shinefold/utils/primitives';
import {
  type REVALIDATE_WEBHOOK_LOG,
  REVALIDATE_WEBHOOK_CHANGE,
} from '@worker/constants/revalidate-webhook';
import { createTenantRevalidateWebhook } from '@worker/steps/create-revalidate-webhook';
import { env } from '@worker/utils/env/env';
import { logger } from '@worker/utils/logger/logger';
import { requireValues } from '@worker/utils/require-values/require-values';

type TRevalidateWebhookLogEvent = TValueOf<typeof REVALIDATE_WEBHOOK_LOG>;

export type TRevalidateWebhookBackfillSummary = {
  updated: string[];
  unchanged: string[];
  failed: string[];
};

type TRevalidateWebhookBackfillEvents = {
  finished: TRevalidateWebhookLogEvent;
  failed: TRevalidateWebhookLogEvent;
};

export async function runRevalidateWebhookStepForEach(
  tenants: TTenant[],
  tenantFailedEvent: TRevalidateWebhookLogEvent,
): Promise<TRevalidateWebhookBackfillSummary> {
  const { WEB_APP_URL } = requireValues({ WEB_APP_URL: env.WEB_APP_URL });
  const summary: TRevalidateWebhookBackfillSummary = {
    updated: [],
    unchanged: [],
    failed: [],
  };

  for (const tenant of tenants) {
    const { id: tenantId } = tenant;
    try {
      const change = await createTenantRevalidateWebhook(tenant, {
        webAppBaseUrl: WEB_APP_URL,
      });
      const bucket =
        change === REVALIDATE_WEBHOOK_CHANGE.UPDATED
          ? summary.updated
          : summary.unchanged;
      bucket.push(tenantId);
    } catch (error) {
      logger.error(tenantFailedEvent, {
        tenantId,
        error: sanitizeLogMessage(error),
      });
      summary.failed.push(tenantId);
    }
  }

  return summary;
}

export async function reportRevalidateWebhookBackfill(
  backfill: () => Promise<TRevalidateWebhookBackfillSummary>,
  events: TRevalidateWebhookBackfillEvents,
): Promise<void> {
  try {
    const summary = await backfill();
    logger.info(events.finished, summary);
    if (hasLength(summary.failed)) process.exitCode = 1;
  } catch (error) {
    logger.error(events.failed, { error: sanitizeLogMessage(error) });
    process.exitCode = 1;
  }
}
