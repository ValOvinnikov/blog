'use server';

import { queries } from '@blog/db';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';

import {
  startProvisioning,
  type TStartProvisioningResult,
} from './start-provisioning';

export type TRetryProvisioningStepResult =
  TStartProvisioningResult | { outcome: 'archived' };

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

  return startProvisioning(tenantId);
};
