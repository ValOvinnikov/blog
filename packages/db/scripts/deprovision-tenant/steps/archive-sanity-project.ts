import type { TTenant } from '@blog/db/schema/tenants';
import { archiveSanityProject } from '@blog/db/utils/sanity-management-client/sanity-management-client';

import type { TDeprovisionEnv } from '../lib/env';

/**
 * Step 3 — archives the tenant's own Sanity project rather than deleting
 * it: `PATCH isDisabledByUser: true` stops it billing without needing the
 * org billing permission project cancellation requires, so unlike
 * deletion this step has no permission-block case to tolerate. Idempotent:
 * `archiveSanityProject` reads the project first and skips the write when
 * it's already archived, and treats a 404 as nothing left to archive.
 */
export async function archiveTenantSanityProject(
  tenant: TTenant,
  env: TDeprovisionEnv,
): Promise<void> {
  if (!tenant.sanityProjectId) return;

  if (env.dryRun) {
    console.warn(
      `[dry-run] would archive Sanity project "${tenant.sanityProjectId}" (dataset "${tenant.sanityDataset}").`,
    );
    return;
  }

  await archiveSanityProject({
    token: env.sanityManagementToken,
    projectId: tenant.sanityProjectId,
  });
}
