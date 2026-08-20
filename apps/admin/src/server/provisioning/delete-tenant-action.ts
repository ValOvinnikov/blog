'use server';

import { recordAuditEvent } from '@admin/server/audit/record-audit-event';
import { requireSuperAdmin } from '@admin/server/auth/require-super-admin';
import { logger } from '@admin/utils/logger/logger';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { queries } from '@blog/db';
import { z } from 'zod';

const deleteTenantInputSchema = z.object({
  confirm: z.string().trim().min(1, 'Type the tenant name to confirm.'),
});

export type TDeleteTenantInput = z.input<typeof deleteTenantInputSchema>;

export type TDeleteTenantResult = { ok: true } | { ok: false; error: string };

/**
 * The tenant status page's hard-delete control. Only offered for a tenant
 * already archived (`deprovisionedAt` set) — deleting the row first would
 * orphan any Sanity/Vercel infrastructure deprovisioning would otherwise
 * have torn down, so this re-checks that precondition independently of the
 * client, which should never render the trigger for a live tenant at all.
 */
export async function deleteTenantAction(
  tenantId: string,
  input: TDeleteTenantInput,
): Promise<TDeleteTenantResult> {
  await requireSuperAdmin();

  const parsed = deleteTenantInputSchema.safeParse(input);
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

  if (!tenant.deprovisionedAt) {
    return {
      ok: false,
      error: 'This tenant must be archived before it can be deleted.',
    };
  }

  const { confirm } = parsed.data;
  if (confirm !== tenant.name) {
    return { ok: false, error: "Doesn't match the tenant's name." };
  }

  try {
    await queries.tenants.deleteTenant(tenantId);
  } catch (error) {
    logger.error('tenants.delete_failed', { tenantId, error });
    return { ok: false, error: "Couldn't delete the tenant — try again." };
  }

  await recordAuditEvent({
    logEvent: 'tenants.delete_audit_failed',
    action: AUDIT_ACTION.DELETED,
    targetType: AUDIT_TARGET_TYPE.TENANT,
    targetId: tenantId,
    details: { name: tenant.name, slug: tenant.slug },
  });

  return { ok: true };
}
