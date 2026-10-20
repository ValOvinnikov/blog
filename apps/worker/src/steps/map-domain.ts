import type { TTenant } from '@blog/db/schema/tenants';
import type { TProvisionEnv } from '@worker/utils/provision-env/provision-env';
import {
  addVercelProjectDomain,
  listVercelProjectDomains,
} from '@worker/utils/vercel-client/vercel-client';

// Never waits on DNS verification: the admin tenant page checks it live.
export async function mapTenantDomain(
  tenant: TTenant,
  env: TProvisionEnv,
): Promise<void> {
  const existingDomains = await listVercelProjectDomains({
    token: env.vercelToken,
    teamId: env.vercelTeamId,
    projectId: env.vercelWebProjectId,
  });

  if (existingDomains.some((d) => d.name === tenant.primaryDomain)) {
    return;
  }

  await addVercelProjectDomain({
    token: env.vercelToken,
    teamId: env.vercelTeamId,
    projectId: env.vercelWebProjectId,
    domain: tenant.primaryDomain,
  });
}
