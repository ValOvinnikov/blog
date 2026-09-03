'use server';

import { AUDIT_ACTION, AUDIT_TARGET_TYPE, ERROR_CODE } from '@blog/config';
import { queries } from '@blog/db';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { logger } from '@platform/utils/logger/logger';
import { z } from 'zod';

import { dispatchProvisioningWorkflow } from './dispatch-provisioning-workflow';

const reactivateTenantInputSchema = z.object({
  confirm: z.string().trim().min(1, 'Type the tenant name to confirm.'),
});

export type TReactivateTenantInput = z.input<
  typeof reactivateTenantInputSchema
>;

export type TReactivateTenantResult =
  { ok: true } | { ok: false; error: string };

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
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input.',
    };
  }

  const tenant = await queries.tenants.getTenantById(tenantId, {
    includeArchived: true,
  });
  if (!tenant) {
    return { ok: false, error: 'Tenant not found.' };
  }

  if (!tenant.deprovisionedAt) {
    return { ok: false, error: 'This tenant is not deprovisioned.' };
  }

  if (parsed.data.confirm !== tenant.name) {
    return { ok: false, error: "Doesn't match the tenant's name." };
  }

  const began = await queries.tenants.beginTenantProvisioning(tenantId);

  if (!began.ok) {
    if (began.error === ERROR_CODE.DB_ALREADY_PROVISIONING) {
      return { ok: false, error: 'Provisioning is already running.' };
    }

    logger.error('provisioning.reactivate_begin_failed', {
      tenantId,
      error: began.error,
    });
    return { ok: false, error: 'Tenant not found.' };
  }

  const dispatched = await dispatchProvisioningWorkflow(tenantId);

  if (!dispatched) {
    const reverted = await queries.tenants.setTenantProvisioningStatus(
      tenantId,
      began.data.previousProvisioningStatus,
    );

    if (!reverted.ok) {
      logger.error('provisioning.reactivate_revert_failed', {
        tenantId,
        error: reverted.error,
      });
    }

    return { ok: false, error: "Couldn't start reactivation — try again." };
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
