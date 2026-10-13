'use server';

import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
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
  | 'confirmRequired'
  | 'notFound'
  | 'notDeprovisioned'
  | 'nameMismatch'
  | 'alreadyInProgress'
  | 'reactivateFailed'
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
    return { ok: false, reason: 'confirmRequired' };
  }

  const resolved = await resolveConfirmedTenant(tenantId, parsed.data.confirm, {
    precondition: ({ deprovisionedAt }) =>
      deprovisionedAt ? undefined : 'notDeprovisioned',
  });
  if (!resolved.ok) {
    return resolved;
  }
  const { tenant } = resolved;

  const { outcome } = await startProvisioning(tenantId);

  if (outcome === 'already-in-progress') {
    return { ok: false, reason: 'alreadyInProgress' };
  }
  if (outcome === 'not-found') {
    return { ok: false, reason: 'notFound' };
  }
  if (outcome === 'dispatch-error') {
    return { ok: false, reason: 'reactivateFailed' };
  }

  await recordAuditEvent({
    logEvent: 'provisioning.reactivate_audit_failed',
    action: AUDIT_ACTION.REACTIVATED,
    targetType: AUDIT_TARGET_TYPE.TENANT,
    targetId: tenantId,
    details: { name: tenant.name },
  });

  return { ok: true };
};
