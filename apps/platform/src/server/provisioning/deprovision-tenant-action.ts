'use server';

import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  isOutcomeSuccess,
} from '@blog/config';
import { toOutcome } from '@blog/utils/to-outcome';
import { PROVISIONING_LOG } from '@platform/constants/provisioning';
import {
  TENANT_FIELD_ERROR,
  TENANT_LOG,
  TENANT_REFUSAL,
} from '@platform/constants/tenant';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { resolveIsPlatformTenant } from '@platform/server/tenants/resolve-is-platform-tenant';
import { logger } from '@platform/utils/logger/logger';
import { z } from 'zod';

import { dispatchDeprovisioningWorkflow } from './dispatch-deprovisioning-workflow';
import {
  confirmTenantInputSchema,
  resolveConfirmedTenant,
} from './resolve-confirmed-tenant';
import type { TTenantLifecycleResult } from './tenant-lifecycle-result';

const deprovisionTenantInputSchema = confirmTenantInputSchema.extend({
  dryRun: z.boolean(),
});

export type TDeprovisionTenantInput = z.input<
  typeof deprovisionTenantInputSchema
>;

export type TDeprovisionTenantResult = TTenantLifecycleResult<
  | typeof TENANT_REFUSAL.NOT_FOUND
  | typeof TENANT_REFUSAL.ALREADY_DEPROVISIONED
  | typeof TENANT_REFUSAL.PLATFORM_TENANT
>;

/**
 * `confirm` is checked here as a fast-fail convenience only;
 * `deprovision-tenant.yml` re-validates it before doing anything destructive.
 */
export const deprovisionTenantAction = async (
  tenantId: string,
  input: TDeprovisionTenantInput,
): Promise<TDeprovisionTenantResult> => {
  await requireSuperAdmin();

  const parsed = deprovisionTenantInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { confirm: { reason: TENANT_FIELD_ERROR.CONFIRM_REQUIRED } },
    };
  }

  const { confirm, dryRun } = parsed.data;
  const resolved = await resolveConfirmedTenant(tenantId, confirm, {
    precondition: ({ deprovisionedAt }) =>
      deprovisionedAt ? TENANT_REFUSAL.ALREADY_DEPROVISIONED : undefined,
  });
  if (!isOutcomeSuccess(resolved)) {
    return resolved;
  }
  const { tenant } = resolved;

  if (await resolveIsPlatformTenant(tenant)) {
    logger.warn(TENANT_LOG.PLATFORM_TENANT_REFUSED, {
      tenantId,
      action: AUDIT_ACTION.DEPROVISION_REQUESTED,
    });
    return {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.PLATFORM_TENANT,
    };
  }

  const dispatched = await dispatchDeprovisioningWorkflow({
    tenantId,
    confirm,
    dryRun,
  });

  if (!dispatched) {
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }

  if (!dryRun) {
    await recordAuditEvent({
      logEvent: PROVISIONING_LOG.DEPROVISION_AUDIT_FAILED,
      action: AUDIT_ACTION.DEPROVISION_REQUESTED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: tenantId,
      details: { name: tenant.name },
    });
  }

  return toOutcome(ACTION_OUTCOME.SUCCESS);
};
