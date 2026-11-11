import { SANITY_WEBHOOK_OPERATION } from '@blog/config/constants';
import { queries } from '@blog/db';
import {
  REVALIDATE_LOG,
  STARTER_DOCUMENT_ID_PREFIX,
} from '@web/constants/revalidate';
import { POST_TYPE } from '@web/server/revalidate/derive-revalidate-paths/derive-revalidate-paths';
import type { TPostWebhookEvent } from '@web/server/revalidate/post-webhook-event/post-webhook-event';
import { logger } from '@web/utils/logger/logger';

export const stampFirstPostPublished = async ({
  operation,
  type,
  id,
  tenantId,
}: TPostWebhookEvent): Promise<void> => {
  if (
    operation === SANITY_WEBHOOK_OPERATION.DELETE ||
    type !== POST_TYPE ||
    id.startsWith(STARTER_DOCUMENT_ID_PREFIX) ||
    !tenantId
  ) {
    return;
  }

  try {
    await queries.tenants.stampTenantFirstPostPublished(tenantId);
  } catch (error) {
    logger.error(REVALIDATE_LOG.FIRST_POST_STAMP_FAILED, {
      tenantId,
      id,
      error,
    });
  }
};
