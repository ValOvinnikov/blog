import type { TTenant } from '@blog/db/schema/tenants';

import type { TDeprovisionContext } from '../lib/context';
import type { TDeprovisionEnv } from '../lib/env';
import { deleteSanityProject } from '../lib/sanity-management-client';

/**
 * Step 3 — deletes the tenant's own Sanity project, taking its dataset,
 * CORS entries, and every minted robot token with it. Idempotent:
 * 404-tolerant for a retry where the project was already deleted.
 *
 * Sanity gates project cancellation behind org billing permission —
 * a scope `SANITY_MANAGEMENT_TOKEN` deliberately doesn't have. That case is
 * non-blocking by design: it's logged and the rest of deprovisioning still
 * runs, returning `keepSanityProjectId: true` so step 4 leaves
 * `tenants.sanityProjectId` populated as the signal that this archived
 * tenant's Sanity project needs manual deletion by someone with that
 * permission. Any other failure still throws and stops the run.
 */
export async function deleteTenantSanityProject(
  tenant: TTenant,
  env: TDeprovisionEnv,
): Promise<Partial<TDeprovisionContext> | void> {
  if (!tenant.sanityProjectId) return;

  if (env.dryRun) {
    console.warn(
      `[dry-run] would delete Sanity project "${tenant.sanityProjectId}" (dataset "${tenant.sanityDataset}").`,
    );
    return;
  }

  const result = await deleteSanityProject({
    token: env.sanityManagementToken,
    projectId: tenant.sanityProjectId,
  });

  if (result.blockedByBillingPermission) {
    console.warn(
      `deprovision-tenant: Sanity project "${tenant.sanityProjectId}" was not deleted — cancellation requires org billing permission this token doesn't have. Leaving it in place for manual deletion; tenants.sanityProjectId stays populated as the signal.`,
    );
    return { keepSanityProjectId: true };
  }
}
