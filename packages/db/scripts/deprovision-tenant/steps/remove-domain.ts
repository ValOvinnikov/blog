import { listTenantHosts } from '@blog/db/queries/tenant-domains/list-tenant-hosts';
import type { TTenant } from '@blog/db/schema/tenants';
import { deleteVercelProjectDomains } from '@blog/db/utils/vercel-client/vercel-project-domains';

import type { TDeprovisionEnv } from '../lib/env';

export async function removeTenantDomain(
  tenant: TTenant,
  env: TDeprovisionEnv,
): Promise<void> {
  const domains = await listTenantHosts(tenant);

  if (env.dryRun) {
    console.warn(
      `[dry-run] would remove domains ${domains.map((domain) => `"${domain}"`).join(', ')} from Vercel project "${env.vercelWebProjectId}".`,
    );
    return;
  }

  await deleteVercelProjectDomains({
    token: env.vercelToken,
    teamId: env.vercelTeamId,
    projectId: env.vercelWebProjectId,
    domains,
  });
}
