import type { TMaybeNull, TMaybeUndefined } from '@blog/config';
import { queries } from '@blog/db';
import {
  REVALIDATE_LOG,
  SANITY_WEBHOOK_OPERATION,
  STARTER_DOCUMENT_ID_PREFIX,
} from '@web/constants/revalidate';
import { POST_TYPE } from '@web/server/revalidate/derive-revalidate-paths/derive-revalidate-paths';
import { logger } from '@web/utils/logger/logger';

export type TStampFirstPostPublishedInput = {
  operation: TMaybeNull<string>;
  type: string;
  id: string;
  tenantId: TMaybeUndefined<string>;
};

export const stampFirstPostPublished = async ({
  operation,
  type,
  id,
  tenantId,
}: TStampFirstPostPublishedInput): Promise<void> => {
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
