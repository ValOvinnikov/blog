import { SANITY_WEBHOOK_OPERATION } from '@blog/config/constants';
import type { TMaybeUndefined } from '@blog/config/types';
import { service, type TTenantSanityContext } from '@blog/service';
import { REVALIDATE_LOG } from '@web/constants/revalidate';
import { POST_TYPE } from '@web/server/revalidate/derive-revalidate-paths/derive-revalidate-paths';
import { enqueueWorkerRun } from '@web/server/revalidate/enqueue-worker-run/enqueue-worker-run';
import type { TPostWebhookEvent } from '@web/server/revalidate/post-webhook-event/post-webhook-event';
import { logger } from '@web/utils/logger/logger';

const SCHEDULED_POST_PURGE_PATH = '/api/scheduled-post-purge';

export type TSchedulePostPurgeInput = TPostWebhookEvent & {
  tenant: TMaybeUndefined<TTenantSanityContext>;
};

// The worker refuses a date already passed; that publish is purged now, like any other.
export const schedulePostPurge = async ({
  operation,
  type,
  id: postId,
  tenantId,
  tenant,
}: TSchedulePostPurgeInput): Promise<void> => {
  if (
    operation === SANITY_WEBHOOK_OPERATION.DELETE ||
    type !== POST_TYPE ||
    !tenantId ||
    !tenant
  ) {
    return;
  }

  const result = await service.entities.posts.v1.getPostPublishedAt(
    postId,
    tenant,
  );
  if (!result.ok) {
    logger.error(REVALIDATE_LOG.SCHEDULED_POST_LOOKUP_FAILED, {
      tenantId,
      postId,
      error: result.error,
    });
    return;
  }
  const publishedAt = result.data;
  if (!publishedAt || Date.parse(publishedAt) <= Date.now()) return;

  await enqueueWorkerRun({
    path: SCHEDULED_POST_PURGE_PATH,
    request: { tenantId, postId, publishedAt },
    log: {
      SKIPPED: REVALIDATE_LOG.SCHEDULED_PURGE_ENQUEUE_SKIPPED,
      REFUSED: REVALIDATE_LOG.SCHEDULED_PURGE_ENQUEUE_REFUSED,
      FAILED: REVALIDATE_LOG.SCHEDULED_PURGE_ENQUEUE_FAILED,
    },
  });
};
