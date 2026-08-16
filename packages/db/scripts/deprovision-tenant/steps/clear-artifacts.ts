import { clearTenantProvisioningArtifacts } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';

import type { TDeprovisionEnv } from '../lib/env';

/**
 * Step 4 — clears the persisted (encrypted) Sanity read token and every
 * other provisioning-artifact column on the `tenants` row, now that the
 * external resources they pointed at are gone.
 */
export async function clearTenantArtifacts(
  tenant: TTenant,
  env: TDeprovisionEnv,
): Promise<void> {
  if (env.dryRun) {
    console.warn(
      `[dry-run] would clear Sanity/Studio provisioning columns for tenant "${tenant.id}".`,
    );
    return;
  }

  await clearTenantProvisioningArtifacts(tenant.id);
}
