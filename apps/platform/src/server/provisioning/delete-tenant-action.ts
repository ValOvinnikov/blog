'use server';

import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { queries } from '@blog/db';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { logger } from '@platform/utils/logger/logger';
import { z } from 'zod';

import type { TTenantLifecycleResult } from './tenant-lifecycle-result';

const deleteTenantInputSchema = z.object({
  confirm: z.string().trim().min(1),
});

export type TDeleteTenantInput = z.input<typeof deleteTenantInputSchema>;

export type TDeleteTenantResult = TTenantLifecycleResult<
  | 'confirmRequired'
  | 'notFound'
  | 'nameMismatch'
  | 'notArchived'
  | 'deleteFailed'
>;

/**
 * The tenant status page's hard-delete control. Fetches the tenant to
 * validate `confirm` against its live name (not trusting the client) and to
 * carry `name` into the audit record; the archived precondition itself is
 * left to `queries.tenants.deleteTenant`'s own typed refusal rather than
 * re-checked here, since re-fetching just to duplicate a check the mutation
 * already makes atomically would only widen the race window.
 */
export const deleteTenantAction = async (
  tenantId: string,
  input: TDeleteTenantInput,
): Promise<TDeleteTenantResult> => {
  await requireSuperAdmin();

  const parsed = deleteTenantInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, reason: 'confirmRequired' };
  }

  const [tenant] = await queries.tenants.listTenantsByIds([tenantId]);
  if (!tenant) {
    return { ok: false, reason: 'notFound' };
  }

  const { confirm } = parsed.data;
  if (confirm !== tenant.name) {
    return { ok: false, reason: 'nameMismatch' };
  }

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
