function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`deprovision-tenant: missing required env var ${name}.`);
  }
  return value;
}

export type TDeprovisionEnv = {
  sanityManagementToken: string;
  vercelToken: string;
  // Only needed when the Vercel account is team-owned.
  vercelTeamId: string | undefined;
  // The *shared* `apps/web` Vercel project id — step 1 removes the tenant's
  // domain from this one project, never a per-tenant project.
  vercelWebProjectId: string;
  // Every step checks this first and, when true, only logs what it would do
  // — never calls a delete API or writes to the `tenants` row.
  dryRun: boolean;
  // Set automatically by Actions for every workflow run; absent for a local
  // run outside Actions. Deliberately not `requireEnv`'d — a missing actor
  // is an audit-write failure to log and skip, not a reason to abort the
  // whole script before it does anything.
  githubActor: string | undefined;
  githubRunId: string | undefined;
  // Together with `githubRunId`, builds the run's `workflowRunUrl` —
  // deliberately not `requireEnv`'d, since a local run legitimately has
  // neither.
  githubRepository: string | undefined;
  githubServerUrl: string | undefined;
  // Not `requireEnv`'d here so a missing value doesn't block the earlier,
  // higher-priority teardown steps — `invalidate-tenant-cache` validates
  // both itself and fails loudly there instead.
  webAppUrl: string | undefined;
  siteConfigRevalidateSecret: string | undefined;
};

export function loadDeprovisionEnv(dryRun: boolean): TDeprovisionEnv {
  return {
    sanityManagementToken: requireEnv('SANITY_MANAGEMENT_TOKEN'),
    vercelToken: requireEnv('VERCEL_TOKEN'),
    vercelTeamId: process.env['VERCEL_TEAM_ID'],
    vercelWebProjectId: requireEnv('VERCEL_PROJECT_ID_WEB'),
    dryRun,
    githubActor: process.env['GITHUB_ACTOR'],
    githubRunId: process.env['GITHUB_RUN_ID'],
    githubRepository: process.env['GITHUB_REPOSITORY'],
    githubServerUrl: process.env['GITHUB_SERVER_URL'],
    webAppUrl: process.env['WEB_APP_URL'],
    siteConfigRevalidateSecret: process.env['SITE_CONFIG_REVALIDATE_SECRET'],
  };
}
