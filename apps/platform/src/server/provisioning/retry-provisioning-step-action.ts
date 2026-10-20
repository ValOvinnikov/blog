'use server';

import { ACTION_OUTCOME, type TActionResult } from '@blog/config';
import { queries } from '@blog/db';
import { TENANT_REFUSAL } from '@platform/constants/tenant';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';

import {
  startProvisioning,
  type TStartProvisioningRefusal,
} from './start-provisioning';

export type TRetryProvisioningRefusal =
  TStartProvisioningRefusal | typeof TENANT_REFUSAL.ARCHIVED;

export type TRetryProvisioningStepResult = TActionResult<
  typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
  never,
  never,
  TRetryProvisioningRefusal
>;

/** Re-runs the whole provisioning rather than one step, since every unit is idempotent. */
export const retryProvisioningStepAction = async (
  tenantId: string,
): Promise<TRetryProvisioningStepResult> => {
  await requireSuperAdmin();

  const tenant = await queries.tenants.getTenantById(tenantId, {
    includeArchived: true,
  });
  if (!tenant) {
    return {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.NOT_FOUND,
    };
  }
  if (tenant.deprovisionedAt) {
    return { outcome: ACTION_OUTCOME.REFUSED, reason: TENANT_REFUSAL.ARCHIVED };
  }

  return startProvisioning(tenantId);
};
