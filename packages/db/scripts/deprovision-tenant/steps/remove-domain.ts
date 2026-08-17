import type { TTenant } from '@blog/db/schema/tenants';

import type { TDeprovisionEnv } from '../lib/env';
import { deleteVercelProjectDomain } from '../lib/vercel-client';

/**
 * Step 1 — removes the tenant's custom domain from the *shared* `apps/web`
 * Vercel project (mirrors `provision-tenant`'s "Map domain" step in
 * reverse). 404-tolerant: a domain that's already gone, or was never
 * mapped, is treated as done rather than an error.
 */
export async function removeTenantDomain(
  tenant: TTenant,
  env: TDeprovisionEnv,
): Promise<void> {
  if (env.dryRun) {
    console.warn(
      `[dry-run] would remove domain "${tenant.primaryDomain}" from Vercel project "${env.vercelWebProjectId}".`,
    );
    return;
  }

  await deleteVercelProjectDomain({
    token: env.vercelToken,
    teamId: env.vercelTeamId,
    projectId: env.vercelWebProjectId,
    domain: tenant.primaryDomain,
  });
}
