'use server';

import { recordAuditEvent } from '@admin/server/audit/record-audit-event';
import { requireAdmin } from '@admin/server/auth/require-admin';
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
 * The tenant status page's hard-delete control. Fetches the tenant to
 * validate `confirm` against its live name (not trusting the client) and to
 * carry `name`/`slug` into the audit record; the archived precondition
 * itself is left to `queries.tenants.deleteTenant`'s own typed refusal
 * rather than re-checked here, since re-fetching just to duplicate a check
 * the mutation already makes atomically would only widen the race window.
 */
export async function deleteTenantAction(
  tenantId: string,
  input: TDeleteTenantInput,
): Promise<TDeleteTenantResult> {
  await requireAdmin();

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

  const { confirm } = parsed.data;
  if (confirm !== tenant.name) {
    return { ok: false, error: "Doesn't match the tenant's name." };
  }

  let result;
  try {
    result = await queries.tenants.deleteTenant(tenantId);
  } catch (error) {
    logger.error('tenants.delete_failed', { tenantId, error });
    return { ok: false, error: "Couldn't delete the tenant — try again." };
  }

  if (result.outcome === 'not-found') {
    return { ok: false, error: 'Tenant not found.' };
  }

  if (result.outcome === 'not-archived') {
    return {
      ok: false,
      error: 'This tenant must be archived before it can be deleted.',
    };
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
