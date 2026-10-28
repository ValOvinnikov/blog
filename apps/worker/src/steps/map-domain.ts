import {
  addVercelProjectDomain,
  listVercelProjectDomains,
} from '@worker/utils/vercel-client/vercel-client';
import type { TVercelEnv } from '@worker/utils/vercel-env/vercel-env';

// Never waits on DNS verification: the admin tenant page checks it live.
export async function mapTenantDomain(
  domain: string,
  env: TVercelEnv,
): Promise<void> {
  const existingDomains = await listVercelProjectDomains({
    token: env.vercelToken,
    teamId: env.vercelTeamId,
    projectId: env.vercelWebProjectId,
  });

  if (existingDomains.some((d) => d.name === domain)) {
    return;
  }

  await addVercelProjectDomain({
    token: env.vercelToken,
    teamId: env.vercelTeamId,
    projectId: env.vercelWebProjectId,
    domain,
  });
}
