import { ACTION_OUTCOME, HTTP_STATUS, type TActionResult } from '@blog/config';
import { isNull } from '@blog/utils/primitives';
import { toOutcome } from '@blog/utils/to-outcome';
import { PROVISIONING_LOG } from '@platform/constants/provisioning';
import { TENANT_REFUSAL } from '@platform/constants/tenant';
import { logger } from '@platform/utils/logger/logger';

import { enqueueProvisioning } from './enqueue-provisioning';

export type TStartProvisioningRefusal =
  typeof TENANT_REFUSAL.ALREADY_IN_PROGRESS | typeof TENANT_REFUSAL.NOT_FOUND;

export type TStartProvisioningResult = TActionResult<
  typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
  never,
  never,
  TStartProvisioningRefusal
>;

/** The worker admits the run through `beginTenantProvisioning`, so its row guard is what refuses a concurrent start. */
export const startProvisioning = async (
  tenantId: string,
): Promise<TStartProvisioningResult> => {
  const status = await enqueueProvisioning(tenantId);

  if (status === HTTP_STATUS.ACCEPTED) {
    return toOutcome(ACTION_OUTCOME.SUCCESS);
  }
  if (status === HTTP_STATUS.CONFLICT) {
    return {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.ALREADY_IN_PROGRESS,
    };
  }
  if (status === HTTP_STATUS.NOT_FOUND) {
    logger.error(PROVISIONING_LOG.ENQUEUE_NOT_FOUND, { tenantId });
    return {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.NOT_FOUND,
    };
  }
  if (!isNull(status)) {
    logger.error(PROVISIONING_LOG.ENQUEUE_FAILED, {
      tenantId,
      responseStatus: status,
    });
  }
  return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
};
