'use server';

import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { queries } from '@blog/db';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { z } from 'zod';

import { startProvisioning } from './start-provisioning';
import type { TTenantLifecycleResult } from './tenant-lifecycle-result';

const reactivateTenantInputSchema = z.object({
  confirm: z.string().trim().min(1),
});

export type TReactivateTenantInput = z.input<
  typeof reactivateTenantInputSchema
>;

export type TReactivateTenantResult = TTenantLifecycleResult<
  | 'confirmRequired'
  | 'notFound'
  | 'notDeprovisioned'
  | 'nameMismatch'
  | 'alreadyInProgress'
  | 'reactivateFailed'
>;

/**
 * The danger page's "Reactivate tenant" control, the recovery path for a
 * tenant deprovisioned by mistake. Dispatching the provisioning workflow is
 * what makes the tenant whole, not `reactivateTenant` on its own: clearing
 * `deprovisionedAt` alone would leave the row reading ACTIVE while its
 * Sanity project stays archived and its domain unmapped.
 */
export const reactivateTenantAction = async (
  tenantId: string,
  input: TReactivateTenantInput,
): Promise<TReactivateTenantResult> => {
  await requireSuperAdmin();

  const parsed = reactivateTenantInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, reason: 'confirmRequired' };
  }

  const tenant = await queries.tenants.getTenantById(tenantId, {
    includeArchived: true,
  });
  if (!tenant) {
    return { ok: false, reason: 'notFound' };
  }

  if (!tenant.deprovisionedAt) {
    return { ok: false, reason: 'notDeprovisioned' };
  }

  if (parsed.data.confirm !== tenant.name) {
    return { ok: false, reason: 'nameMismatch' };
  }

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
