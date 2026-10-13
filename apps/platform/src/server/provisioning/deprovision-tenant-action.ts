'use server';

import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { queries } from '@blog/db';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { z } from 'zod';

import { dispatchDeprovisioningWorkflow } from './dispatch-deprovisioning-workflow';
import type { TTenantLifecycleResult } from './tenant-lifecycle-result';

const deprovisionTenantInputSchema = z.object({
  confirm: z.string().trim().min(1),
  dryRun: z.boolean(),
});

export type TDeprovisionTenantInput = z.input<
  typeof deprovisionTenantInputSchema
>;

export type TDeprovisionTenantResult = TTenantLifecycleResult<
  | 'confirmRequired'
  | 'notFound'
  | 'alreadyDeprovisioned'
  | 'nameMismatch'
  | 'deprovisionFailed'
>;

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
    return { ok: false, reason: 'confirmRequired' };
  }

  const [tenant] = await queries.tenants.listTenantsByIds([tenantId]);
  if (!tenant) {
    return { ok: false, reason: 'notFound' };
  }

  if (tenant.deprovisionedAt) {
    return { ok: false, reason: 'alreadyDeprovisioned' };
  }

  const { confirm, dryRun } = parsed.data;
  if (confirm !== tenant.name) {
    return { ok: false, reason: 'nameMismatch' };
  }

  const dispatched = await dispatchDeprovisioningWorkflow({
    tenantId,
    confirm,
    dryRun,
  });

  if (!dispatched) {
    return { ok: false, reason: 'deprovisionFailed' };
  }

  if (!dryRun) {
    await recordAuditEvent({
      logEvent: 'provisioning.deprovision_audit_failed',
      action: AUDIT_ACTION.DEPROVISION_REQUESTED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: tenantId,
      details: { name: tenant.name },
    });
  }

  return { ok: true };
};
