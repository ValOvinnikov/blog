import type { TTenant } from '@blog/db/schema/tenants';

import type { TProvisionEnv } from '../lib/env';
import {
  addVercelProjectDomain,
  listVercelProjectDomains,
} from '../lib/vercel-client';

/**
 * Step 5 — adds the tenant's custom domain to the *shared* web app's
 * existing Vercel project (never a per-tenant project — the frontend is one
 * shared deployment every tenant's domain routes into).
 *
 * Idempotent: skips if the domain is already registered on the project.
 * Never waits on DNS verification — this step is done once the domain is
 * *added*, regardless of verification state; the admin tenant detail page
 * checks live verification status independently, on each render.
 */
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
