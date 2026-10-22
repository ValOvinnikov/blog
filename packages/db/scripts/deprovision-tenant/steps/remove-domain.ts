import type { TTenant } from '@blog/db/schema/tenants';
import { deleteVercelProjectDomain } from '@blog/db/utils/vercel-client/vercel-project-domains';

import type { TDeprovisionEnv } from '../lib/env';

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
