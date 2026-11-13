'use server';

import {
  ACTION_OUTCOME,
  isOutcomeSuccess,
  type TActionResult,
} from '@blog/config';
import { TENANT_REFUSAL } from '@platform/constants/tenant';
import { isSuperAdmin } from '@platform/server/auth/is-super-admin';
import { requireTenantOwnerOrAdmin } from '@platform/server/auth/require-tenant-owner-or-admin';
import { resolveLiveTenant } from '@platform/server/tenants/resolve-live-tenant';

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
  await requireTenantOwnerOrAdmin(tenantId, isSuperAdmin);

  const resolved = await resolveLiveTenant(tenantId);
  if (!isOutcomeSuccess(resolved)) return resolved;

  return startProvisioning(tenantId);
};
