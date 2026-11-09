import 'server-only';

import { HTTP_STATUS } from '@blog/config';
import type { TLocaleIsoCode } from '@blog/config/constants';
import { isNull } from '@blog/utils/primitives';
import {
  COOKIE_STATEMENT_LOG,
  COOKIE_STATEMENT_PATH,
} from '@platform/constants/cookie-statement';
import { enqueueWorkerRequest } from '@platform/server/provisioning/enqueue-provisioning';
import { logger } from '@platform/utils/logger/logger';

export const enqueueCookieStatementSeed = async (
  tenantId: string,
  locales: TLocaleIsoCode[],
): Promise<void> => {
  const status = await enqueueWorkerRequest(COOKIE_STATEMENT_PATH.SEED, {
    tenantId,
    locales,
  });
  if (isNull(status) || status === HTTP_STATUS.ACCEPTED) return;

  logger.error(COOKIE_STATEMENT_LOG.SEED_ENQUEUE_REJECTED, {
    tenantId,
    locales,
    responseStatus: status,
  });
};
