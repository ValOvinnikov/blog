import { clearTenantProvisioningArtifacts } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';

import type { TDeprovisionEnv } from '../lib/env';

/**
 * Step 3 — clears the persisted (encrypted) Sanity read token and every
 * other provisioning-artifact column on the `tenants` row, now that the
 * external resources they pointed at are gone. `sanityProjectId` and
 * `sanityDataset` are left untouched: the Sanity project itself was
 * archived, not deleted, so it still exists — its id stays the pointer a
 * later permanent tenant deletion needs to clean it up.
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
