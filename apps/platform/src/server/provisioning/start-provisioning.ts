import { ERROR_CODE } from '@blog/config';
import { queries } from '@blog/db';
import { logger } from '@platform/utils/logger/logger';

import { dispatchProvisioningWorkflow } from './dispatch-provisioning-workflow';

export type TStartProvisioningResult =
  | { outcome: 'dispatched' }
  | { outcome: 'already-in-progress' }
  | { outcome: 'not-found' }
  | { outcome: 'dispatch-error' };

/** A failed dispatch reverts the tenant to its previous provisioning status. */
export const startProvisioning = async (
  tenantId: string,
): Promise<TStartProvisioningResult> => {
  const began = await queries.tenants.beginTenantProvisioning(tenantId);

  if (!began.ok) {
    if (began.error === ERROR_CODE.DB_ALREADY_PROVISIONING) {
      return { outcome: 'already-in-progress' };
    }

    logger.error('provisioning.begin_failed', {
      tenantId,
      error: began.error,
    });
    return { outcome: 'not-found' };
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

    return { outcome: 'dispatch-error' };
  }

  return { outcome: 'dispatched' };
};
