'use server';

import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { queries } from '@blog/db';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { z } from 'zod';

import { dispatchDeprovisioningWorkflow } from './dispatch-deprovisioning-workflow';

const deprovisionTenantInputSchema = z.object({
  confirm: z.string().trim().min(1, 'Type the tenant name to confirm.'),
  dryRun: z.boolean(),
});

export type TDeprovisionTenantInput = z.input<
  typeof deprovisionTenantInputSchema
>;

export type TDeprovisionTenantResult =
  { ok: true } | { ok: false; error: string };

/**
 * The tenant status page's "Deprovision tenant" control. `confirm` is
 * checked against the tenant's live name here as a fast-fail UX convenience
 * only — `deprovision-tenant.yml` re-validates it independently before doing
 * anything destructive.
 */
export const deprovisionTenantAction = async (
  tenantId: string,
  input: TDeprovisionTenantInput,
): Promise<TDeprovisionTenantResult> => {
  await requireSuperAdmin();

  const parsed = deprovisionTenantInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input.',
    };
  }

  const [tenant] = await queries.tenants.listTenantsByIds([tenantId]);
  if (!tenant) {
    return { ok: false, error: 'Tenant not found.' };
  }

  if (tenant.deprovisionedAt) {
    return { ok: false, error: 'This tenant is already deprovisioned.' };
  }

  const { confirm, dryRun } = parsed.data;
  if (confirm !== tenant.name) {
    return { ok: false, error: "Doesn't match the tenant's name." };
  }

  const dispatched = await dispatchDeprovisioningWorkflow({
    tenantId,
    confirm,
    dryRun,
  });

  if (!dispatched) {
    return { ok: false, error: "Couldn't start deprovisioning — try again." };
  }

  // A dry run never actually deprovisions anything — only a real dispatch
  // is a lifecycle fact worth recording.
  if (!dryRun) {
    await recordAuditEvent({
      logEvent: 'provisioning.deprovision_audit_failed',
      action: AUDIT_ACTION.DEPROVISIONED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: tenantId,
      details: { name: tenant.name },
    });
  }

  return { ok: true };
};
