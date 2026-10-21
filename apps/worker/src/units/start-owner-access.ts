import { sanitizeLogMessage } from '@blog/insight';
import { PROVISIONING_UNIT_MAX_RETRIES } from '@worker/constants/provisioning';
import { logger } from '@worker/utils/logger/logger';
import { wakeOwnerAccess } from '@worker/utils/owner-access-run/owner-access-run';

import { isFinalStepAttempt, type TUnitContext } from './run-reported-step';

export async function startOwnerAccess(
  tenantId: string,
  ctx: TUnitContext,
): Promise<void> {
  'use step';

  try {
    await wakeOwnerAccess(tenantId);
  } catch (error) {
    if (!isFinalStepAttempt(error, ctx)) throw error;
    logger.error('owner_access.start_failed', {
      tenantId,
      runId: ctx.runId,
      error: sanitizeLogMessage(error),
    });
  }
}

startOwnerAccess.maxRetries = PROVISIONING_UNIT_MAX_RETRIES;
