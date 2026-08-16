import type { TTenant } from '@blog/db/schema/tenants';

import type { TDeprovisionEnv } from '../lib/env';
import { deleteVercelProject } from '../lib/vercel-client';

/**
 * Step 2 — deletes the tenant's own Studio Vercel project. Idempotent: skips
 * entirely once `tenants.studioVercelProjectId` is already cleared (step 4),
 * and 404-tolerant for a retry where the project was already deleted but the
 * column hasn't been cleared yet.
 */
export async function deleteTenantStudioProject(
  tenant: TTenant,
  env: TDeprovisionEnv,
): Promise<void> {
  if (!tenant.studioVercelProjectId) return;

  if (env.dryRun) {
    console.warn(
      `[dry-run] would delete Studio Vercel project "${tenant.studioVercelProjectId}".`,
    );
    return;
  }

  await deleteVercelProject({
    token: env.vercelToken,
    teamId: env.vercelTeamId,
    projectId: tenant.studioVercelProjectId,
  });
}
