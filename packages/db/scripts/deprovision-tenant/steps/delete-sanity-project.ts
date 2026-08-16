import type { TTenant } from '@blog/db/schema/tenants';

import type { TDeprovisionEnv } from '../lib/env';
import { deleteSanityProject } from '../lib/sanity-management-client';

/**
 * Step 3 — deletes the tenant's own Sanity project, taking its dataset,
 * CORS entries, and every minted robot token with it. Idempotent: skips once
 * `tenants.sanityProjectId` is already cleared (step 4), and 404-tolerant
 * for a retry where the project was already deleted but the column hasn't
 * been cleared yet.
 */
export async function deleteTenantSanityProject(
  tenant: TTenant,
  env: TDeprovisionEnv,
): Promise<void> {
  if (!tenant.sanityProjectId) return;

  if (env.dryRun) {
    console.warn(
      `[dry-run] would delete Sanity project "${tenant.sanityProjectId}" (dataset "${tenant.sanityDataset}").`,
    );
    return;
  }

  await deleteSanityProject({
    token: env.sanityManagementToken,
    projectId: tenant.sanityProjectId,
  });
}
