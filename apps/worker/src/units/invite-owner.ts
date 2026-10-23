import { sanitizeLogMessage } from '@blog/insight';
import { okResult } from '@blog/utils/result';
import { PROVISIONING_UNIT_MAX_RETRIES } from '@worker/constants/provisioning';
import { logger } from '@worker/utils/logger/logger';
import {
  findOwner,
  loadOwnerAccessTarget,
} from '@worker/utils/owner-access/owner-access-target';
import { sendOwnerInvite } from '@worker/utils/owner-access/owner-invite';

import {
  isFinalStepAttempt,
  type TUnitContext,
  type TUnitResult,
} from './run-reported-step';

export async function inviteOwner(
  tenantId: string,
  ctx: TUnitContext,
): Promise<TUnitResult> {
  'use step';

  try {
    const target = await loadOwnerAccessTarget(tenantId);
    const owner = await findOwner(target);
    if (!owner) await sendOwnerInvite(target, { replaceExisting: false });
  } catch (error) {
    if (!isFinalStepAttempt(error, ctx)) throw error;
    logger.error('owner_access.invite_failed', {
      tenantId,
      runId: ctx.runId,
      error: sanitizeLogMessage(error),
    });
  }
  return okResult();
}

inviteOwner.maxRetries = PROVISIONING_UNIT_MAX_RETRIES;
