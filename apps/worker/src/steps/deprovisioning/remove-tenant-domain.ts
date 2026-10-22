import type { TTenant } from '@blog/db/schema/tenants';
import { deleteVercelProjectDomain } from '@blog/db/utils/vercel-client/vercel-project-domains';
import type { TDeprovisionEnv } from '@worker/utils/deprovision-env/deprovision-env';

export async function removeTenantDomain(
  tenant: TTenant,
  env: TDeprovisionEnv,
): Promise<void> {
  await deleteVercelProjectDomain({
    token: env.vercelToken,
    teamId: env.vercelTeamId,
    projectId: env.vercelWebProjectId,
    domain: tenant.primaryDomain,
  });
}
