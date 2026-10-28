import { listTenantHosts } from '@blog/db/queries/tenant-domains/list-tenant-hosts';
import type { TTenant } from '@blog/db/schema/tenants';
import { deleteVercelProjectDomains } from '@blog/db/utils/vercel-client/vercel-project-domains';
import type { TDeprovisionEnv } from '@worker/utils/deprovision-env/deprovision-env';

export async function removeTenantDomain(
  tenant: TTenant,
  env: TDeprovisionEnv,
): Promise<void> {
  await deleteVercelProjectDomains({
    token: env.vercelToken,
    teamId: env.vercelTeamId,
    projectId: env.vercelWebProjectId,
    domains: await listTenantHosts(tenant),
  });
}
