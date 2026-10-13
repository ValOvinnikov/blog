'use server';

import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
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
  | 'confirmRequired'
  | 'notFound'
  | 'alreadyDeprovisioned'
  | 'nameMismatch'
  | 'deprovisionFailed'
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
    return { ok: false, reason: 'confirmRequired' };
  }

  const { confirm, dryRun } = parsed.data;
  const resolved = await resolveConfirmedTenant(tenantId, confirm, {
    precondition: ({ deprovisionedAt }) =>
      deprovisionedAt ? 'alreadyDeprovisioned' : undefined,
  });
  if (!resolved.ok) {
    return resolved;
  }
  const { tenant } = resolved;

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
