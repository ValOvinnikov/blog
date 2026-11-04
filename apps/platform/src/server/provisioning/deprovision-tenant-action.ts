'use server';

import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  HTTP_STATUS,
  isOutcomeSuccess,
} from '@blog/config';
import { isNull } from '@blog/utils/primitives';
import { toOutcome } from '@blog/utils/to-outcome';
import {
  DEPROVISION_PATH,
  PROVISIONING_LOG,
} from '@platform/constants/provisioning';
import {
  TENANT_FIELD_ERROR,
  TENANT_LOG,
  TENANT_REFUSAL,
} from '@platform/constants/tenant';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { resolveIsPlatformTenant } from '@platform/server/tenants/resolve-is-platform-tenant';
import { logger } from '@platform/utils/logger/logger';
import type { z } from 'zod';

import { enqueueWorkerRequest } from './enqueue-provisioning';
import {
  confirmTenantInputSchema,
  resolveConfirmedTenant,
} from './resolve-confirmed-tenant';
import type { TTenantLifecycleResult } from './tenant-lifecycle-result';

export type TDeprovisionTenantInput = z.input<typeof confirmTenantInputSchema>;

export type TDeprovisionTenantResult = TTenantLifecycleResult<
  | typeof TENANT_REFUSAL.NOT_FOUND
  | typeof TENANT_REFUSAL.ALREADY_DEPROVISIONED
  | typeof TENANT_REFUSAL.PLATFORM_TENANT
>;

/** The worker's run checks neither the typed name nor the platform tenant, so this action is the only guard. */
export const deprovisionTenantAction = async (
  tenantId: string,
  input: TDeprovisionTenantInput,
): Promise<TDeprovisionTenantResult> => {
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

  const status = await enqueueWorkerRequest(DEPROVISION_PATH, { tenantId });
  if (status !== HTTP_STATUS.ACCEPTED) {
    if (!isNull(status)) {
      logger.error(PROVISIONING_LOG.DEPROVISION_ENQUEUE_REJECTED, {
        tenantId,
        responseStatus: status,
      });
    }
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }

  await recordAuditEvent({
    logEvent: PROVISIONING_LOG.DEPROVISION_AUDIT_FAILED,
    action: AUDIT_ACTION.DEPROVISION_REQUESTED,
    targetType: AUDIT_TARGET_TYPE.TENANT,
    targetId: tenantId,
    details: { name: tenant.name },
  });

  return toOutcome(ACTION_OUTCOME.SUCCESS);
};
