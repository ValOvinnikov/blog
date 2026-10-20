'use server';

import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  TENANT_DELETE_OUTCOME,
} from '@blog/config';
import { queries } from '@blog/db';
import { TENANT_FIELD_ERROR, TENANT_REFUSAL } from '@platform/constants/tenant';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { logger } from '@platform/utils/logger/logger';
import type { z } from 'zod';

import {
  confirmTenantInputSchema,
  resolveConfirmedTenant,
} from './resolve-confirmed-tenant';
import type { TTenantLifecycleResult } from './tenant-lifecycle-result';

export type TDeleteTenantInput = z.input<typeof confirmTenantInputSchema>;

export type TDeleteTenantResult = TTenantLifecycleResult<
  typeof TENANT_REFUSAL.NOT_FOUND | typeof TENANT_REFUSAL.NOT_ARCHIVED
>;

/**
 * The archived precondition is left to `queries.tenants.deleteTenant`'s own
 * atomic refusal; checking it here as well would only widen the race window.
 */
export const deleteTenantAction = async (
  tenantId: string,
  input: TDeleteTenantInput,
): Promise<TDeleteTenantResult> => {
  await requireSuperAdmin();

  const parsed = confirmTenantInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { confirm: { reason: TENANT_FIELD_ERROR.CONFIRM_REQUIRED } },
    };
  }

  const resolved = await resolveConfirmedTenant(tenantId, parsed.data.confirm);
  if (resolved.outcome !== ACTION_OUTCOME.SUCCESS) {
    return resolved;
  }
  const { tenant } = resolved;

  let result;
  try {
    result = await queries.tenants.deleteTenant(tenantId);
  } catch (error) {
    logger.error('tenants.delete_failed', { tenantId, error });
    return { outcome: ACTION_OUTCOME.SERVER_ERROR };
  }

  if (result.outcome === TENANT_DELETE_OUTCOME.NOT_FOUND) {
    return {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.NOT_FOUND,
    };
  }

  if (result.outcome === TENANT_DELETE_OUTCOME.NOT_ARCHIVED) {
    return {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.NOT_ARCHIVED,
    };
  }

  await recordAuditEvent({
    logEvent: 'tenants.delete_audit_failed',
    action: AUDIT_ACTION.DELETED,
    targetType: AUDIT_TARGET_TYPE.TENANT,
    targetId: tenantId,
    details: { name: tenant.name },
  });

  return { outcome: ACTION_OUTCOME.SUCCESS };
};
