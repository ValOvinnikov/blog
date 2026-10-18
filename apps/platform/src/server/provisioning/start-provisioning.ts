import { ACTION_OUTCOME, ERROR_CODE, type TActionResult } from '@blog/config';
import { queries } from '@blog/db';
import { TENANT_REFUSAL } from '@platform/constants/tenant';
import { logger } from '@platform/utils/logger/logger';

import { dispatchProvisioningWorkflow } from './dispatch-provisioning-workflow';

export type TStartProvisioningRefusal =
  typeof TENANT_REFUSAL.ALREADY_IN_PROGRESS | typeof TENANT_REFUSAL.NOT_FOUND;

export type TStartProvisioningResult = TActionResult<
  typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
  never,
  never,
  TStartProvisioningRefusal
>;

/** A failed dispatch reverts the tenant to its previous provisioning status. */
export const startProvisioning = async (
  tenantId: string,
): Promise<TStartProvisioningResult> => {
  const began = await queries.tenants.beginTenantProvisioning(tenantId);

  if (!began.ok) {
    if (began.error === ERROR_CODE.DB_ALREADY_PROVISIONING) {
      return {
        outcome: ACTION_OUTCOME.REFUSED,
        reason: TENANT_REFUSAL.ALREADY_IN_PROGRESS,
      };
    }

    logger.error('provisioning.begin_failed', {
      tenantId,
      error: began.error,
    });
    return {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.NOT_FOUND,
    };
  }

  const dispatched = await dispatchProvisioningWorkflow(tenantId);

  if (!dispatched) {
    const reverted = await queries.tenants.setTenantProvisioningStatus(
      tenantId,
      began.data.previousProvisioningStatus,
    );

    if (!reverted.ok) {
      logger.error('provisioning.revert_failed', {
        tenantId,
        error: reverted.error,
      });
    }

    return { outcome: ACTION_OUTCOME.SERVER_ERROR };
  }

  return { outcome: ACTION_OUTCOME.SUCCESS };
};
