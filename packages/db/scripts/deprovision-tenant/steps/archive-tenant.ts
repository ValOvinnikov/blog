import { archiveTenant } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';

import type { TDeprovisionEnv } from '../lib/env';
import { recordDeprovisionAuditEvent } from '../lib/record-deprovision-audit-event';

/**
 * Step 5 — soft-deletes the `tenants` row by stamping `deprovisionedAt`,
 * never a hard delete. Idempotent: skips once already set (the top-level
 * `main()` guard already short-circuits on this, but the check stays here
 * too so the step is safe to call in isolation).
 */
export async function archiveTenantRow(
  tenant: TTenant,
  env: TDeprovisionEnv,
): Promise<void> {
  if (tenant.deprovisionedAt) return;

  if (env.dryRun) {
    console.warn(
      `[dry-run] would mark tenant "${tenant.id}" as deprovisioned.`,
    );
    return;
  }

  const result = await archiveTenant(tenant.id);
  if (!result.ok) {
    throw new Error(
      `archive-tenant: archiveTenant failed for "${tenant.id}" (${result.error}).`,
    );
  }

  await recordDeprovisionAuditEvent(tenant.id, env);
}
