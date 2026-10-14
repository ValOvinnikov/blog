'use server';

import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { queries } from '@blog/db';
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
  | 'confirmRequired'
  | 'notFound'
  | 'nameMismatch'
  | 'notArchived'
  | 'deleteFailed'
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
    return { ok: false, reason: 'confirmRequired' };
  }

  const resolved = await resolveConfirmedTenant(tenantId, parsed.data.confirm);
  if (!resolved.ok) {
    return resolved;
  }
  const { tenant } = resolved;

  let result;
  try {
    result = await queries.tenants.deleteTenant(tenantId);
  } catch (error) {
    logger.error('tenants.delete_failed', { tenantId, error });
    return { ok: false, reason: 'deleteFailed' };
  }

  if (result.outcome === 'not-found') {
    return { ok: false, reason: 'notFound' };
  }

  if (result.outcome === 'not-archived') {
    return { ok: false, reason: 'notArchived' };
  }

  await recordAuditEvent({
    logEvent: 'tenants.delete_audit_failed',
    action: AUDIT_ACTION.DELETED,
    targetType: AUDIT_TARGET_TYPE.TENANT,
    targetId: tenantId,
    details: { name: tenant.name },
  });

  return { ok: true };
};
