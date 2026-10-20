'use server';

import { ACTION_OUTCOME, AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { toOutcome } from '@blog/utils/to-outcome';
import { TENANT_FIELD_ERROR, TENANT_REFUSAL } from '@platform/constants/tenant';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import type { z } from 'zod';

import {
  confirmTenantInputSchema,
  resolveConfirmedTenant,
} from './resolve-confirmed-tenant';
import { startProvisioning } from './start-provisioning';
import type { TTenantLifecycleResult } from './tenant-lifecycle-result';

export type TReactivateTenantInput = z.input<typeof confirmTenantInputSchema>;

export type TReactivateTenantResult = TTenantLifecycleResult<
  | typeof TENANT_REFUSAL.NOT_FOUND
  | typeof TENANT_REFUSAL.NOT_DEPROVISIONED
  | typeof TENANT_REFUSAL.ALREADY_IN_PROGRESS
>;

/**
 * Dispatching the provisioning workflow is what makes the tenant whole:
 * clearing `deprovisionedAt` alone would leave the row reading ACTIVE while
 * its Sanity project stays archived and its domain unmapped.
 */
export const reactivateTenantAction = async (
  tenantId: string,
  input: TReactivateTenantInput,
): Promise<TReactivateTenantResult> => {
  await requireSuperAdmin();

  const parsed = confirmTenantInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { confirm: { reason: TENANT_FIELD_ERROR.CONFIRM_REQUIRED } },
    };
  }

  const resolved = await resolveConfirmedTenant(tenantId, parsed.data.confirm, {
    precondition: ({ deprovisionedAt }) =>
      deprovisionedAt ? undefined : TENANT_REFUSAL.NOT_DEPROVISIONED,
  });
  if (resolved.outcome !== ACTION_OUTCOME.SUCCESS) {
    return resolved;
  }
  const { tenant } = resolved;

  const started = await startProvisioning(tenantId);
  if (started.outcome !== ACTION_OUTCOME.SUCCESS) {
    return started;
  }

  await recordAuditEvent({
    logEvent: 'provisioning.reactivate_audit_failed',
    action: AUDIT_ACTION.REACTIVATED,
    targetType: AUDIT_TARGET_TYPE.TENANT,
    targetId: tenantId,
    details: { name: tenant.name },
  });

  return toOutcome(ACTION_OUTCOME.SUCCESS);
};
