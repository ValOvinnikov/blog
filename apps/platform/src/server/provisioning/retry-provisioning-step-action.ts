'use server';

import { ERROR_CODE } from '@blog/config/constants';
import { queries } from '@blog/db';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { logger } from '@platform/utils/logger/logger';

import { dispatchProvisioningWorkflow } from './dispatch-provisioning-workflow';

export type TRetryProvisioningStepResult =
  | { outcome: 'dispatched' }
  | { outcome: 'already-in-progress' }
  | { outcome: 'not-found' }
  | { outcome: 'archived' }
  | { outcome: 'dispatch-error' };

/**
 * Backs both the status page's per-step Retry button and its all-idle Start
 * action — re-dispatches the whole workflow rather than a single step, since
 * every step is independently idempotent. The archived check below is the
 * same disabled-button-is-UX, server-check-is-enforcement split as the
 * tenant details save action; `beginTenantProvisioning`'s atomic guard is
 * likewise the real backstop against a concurrent double-dispatch.
 */
export const retryProvisioningStepAction = async (
  tenantId: string,
): Promise<TRetryProvisioningStepResult> => {
  await requireSuperAdmin();

  const tenant = await queries.tenants.getTenantById(tenantId, {
    includeArchived: true,
  });
  if (!tenant) {
    return { outcome: 'not-found' };
  }
  if (tenant.deprovisionedAt) {
    return { outcome: 'archived' };
  }

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
