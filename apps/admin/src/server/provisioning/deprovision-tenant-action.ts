'use server';

import { requireAdmin } from '@admin/server/auth/require-admin';
import { queries } from '@blog/db';
import { z } from 'zod';

import { dispatchDeprovisioningWorkflow } from './dispatch-deprovisioning-workflow';

const deprovisionTenantInputSchema = z.object({
  confirm: z.string().trim().min(1, 'Type the tenant slug to confirm.'),
  dryRun: z.boolean(),
});

export type TDeprovisionTenantInput = z.input<
  typeof deprovisionTenantInputSchema
>;

export type TDeprovisionTenantResult =
  { ok: true } | { ok: false; error: string };

/**
 * The tenant status page's "Deprovision tenant" control. Re-checks `confirm`
 * against the tenant's live slug before dispatching — a fast-fail UX
 * convenience, not the actual security boundary: `deprovision-tenant.yml`
 * re-validates the same check independently before doing anything
 * destructive.
 */
export async function deprovisionTenantAction(
  tenantId: string,
  input: TDeprovisionTenantInput,
): Promise<TDeprovisionTenantResult> {
  await requireAdmin();

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
  if (confirm !== tenant.slug) {
    return { ok: false, error: "Doesn't match the tenant's slug." };
  }

  await dispatchDeprovisioningWorkflow({ tenantId, confirm, dryRun });

  return { ok: true };
}
