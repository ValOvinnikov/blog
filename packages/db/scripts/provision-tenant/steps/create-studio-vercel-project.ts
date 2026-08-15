import { setTenantStudioVercelProject } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';

import type { TProvisionEnv } from '../lib/env';
import { defaultExec, type TExecFn } from '../lib/exec';
import { REPO_ROOT } from '../lib/repo-root';
import {
  addVercelProjectDomain,
  createVercelProject,
  listVercelProjectDomains,
} from '../lib/vercel-client';

const STUDIO_ROOT_DIRECTORY = 'apps/cms';

export function studioDomainForSlug(slug: string): string {
  return `studio-${slug}.valstack.dev`;
}

export type TCreateStudioVercelProjectDeps = { exec: TExecFn };

export type TCreateTenantStudioResult = { studioVercelProjectId: string };

/**
 * Step 3 — creates the tenant's own Vercel project (rooted at `apps/cms`,
 * inheriting that directory's committed `vercel.json`, so Git auto-deploy
 * stays disabled the same way it is for `cms-dev`/`cms-prod`), points
 * `studio-<slug>.valstack.dev` at it, then builds and deploys via the same
 * `vercel pull → build --prod → deploy --prebuilt --prod` sequence
 * `deploy-production.yml`'s `deploy-studio` job uses — just against a
 * freshly created project instead of the existing `VERCEL_PROJECT_ID_CMS`.
 *
 * Idempotent for project creation: reuses `tenants.studioVercelProjectId`
 * once set. The build/deploy commands themselves still run every time —
 * a tenant whose project row got persisted but whose first deploy never
 * completed (a crash between the two) should still get that deploy on
 * retry, not be skipped because the row exists.
 */
export async function createTenantStudio(
  tenant: TTenant,
  env: TProvisionEnv,
  deps: TCreateStudioVercelProjectDeps = { exec: defaultExec },
): Promise<TCreateTenantStudioResult> {
  if (!tenant.sanityProjectId || !tenant.sanityDataset) {
    throw new Error(
      `createTenantStudio: tenant "${tenant.id}" has no Sanity project yet — run the "Create Sanity project" step first.`,
    );
  }

  let studioVercelProjectId = tenant.studioVercelProjectId ?? undefined;

  if (!studioVercelProjectId) {
    const project = await createVercelProject({
      token: env.vercelToken,
      teamId: env.vercelTeamId,
      name: `studio-${tenant.slug}`,
      rootDirectory: STUDIO_ROOT_DIRECTORY,
    });
    studioVercelProjectId = project.id;

    await setTenantStudioVercelProject(tenant.id, studioVercelProjectId);
  }

  const domain = studioDomainForSlug(tenant.slug);
  const existingDomains = await listVercelProjectDomains({
    token: env.vercelToken,
    teamId: env.vercelTeamId,
    projectId: studioVercelProjectId,
  });
  if (!existingDomains.some((d) => d.name === domain)) {
    await addVercelProjectDomain({
      token: env.vercelToken,
      teamId: env.vercelTeamId,
      projectId: studioVercelProjectId,
      domain,
    });
  }

  const cliEnv: NodeJS.ProcessEnv = {
    ...process.env,
    VERCEL_TOKEN: env.vercelToken,
    VERCEL_ORG_ID: env.vercelOrgId,
    VERCEL_PROJECT_ID: studioVercelProjectId,
    SANITY_STUDIO_PROJECT_ID: tenant.sanityProjectId,
    SANITY_STUDIO_DATASET: tenant.sanityDataset,
  };
  const vercelCli = `vercel@${env.vercelCliVersion}`;

  deps.exec(
    'npx',
    [
      '--yes',
      vercelCli,
      'pull',
      '--yes',
      '--environment=production',
      `--token=${env.vercelToken}`,
    ],
    { cwd: REPO_ROOT, env: cliEnv },
  );
  deps.exec(
    'npx',
    ['--yes', vercelCli, 'build', '--prod', `--token=${env.vercelToken}`],
    { cwd: REPO_ROOT, env: cliEnv },
  );
  deps.exec(
    'npx',
    [
      '--yes',
      vercelCli,
      'deploy',
      '--prebuilt',
      '--prod',
      `--token=${env.vercelToken}`,
    ],
    { cwd: REPO_ROOT, env: cliEnv },
  );

  return { studioVercelProjectId };
}
