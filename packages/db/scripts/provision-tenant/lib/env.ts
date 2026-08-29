function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`provision-tenant: missing required env var ${name}.`);
  }
  return value;
}

export type TProvisionEnv = {
  // Broader-scoped than the existing `SANITY_MIGRATE_TOKEN` — an
  // organization-level token with "create project" permission.
  sanityManagementToken: string;
  // The Sanity organization every tenant project must be created under —
  // omitting it silently creates the project in whichever org the token's
  // owner defaults to, not necessarily this repo's org.
  sanityOrganizationId: string;
  vercelToken: string;
  // Only needed when the Vercel account is team-owned.
  vercelTeamId: string | undefined;
  // The *shared* `apps/web` Vercel project id — step 4 adds every tenant's
  // custom domain to this one project, never a per-tenant project.
  vercelWebProjectId: string;
  // Base origin of the deployed `apps/platform` app (no trailing slash/path) —
  // the Sanity CORS origin step 1 adds.
  adminAppBaseUrl: string;
  // Name of the Sanity dataset created for each tenant's project.
  tenantSanityDataset: string;
  // Base origin of the deployed, shared `apps/web` app (no trailing
  // slash/path) — every tenant's revalidation webhook targets the same
  // `${webAppBaseUrl}/api/revalidate`, since that route tenant-scopes its
  // own cache tags off Sanity's `sanity-project-id` header.
  webAppBaseUrl: string;
  // Must be byte-identical to `apps/web`'s own `SANITY_REVALIDATE_SECRET` —
  // the value each tenant's webhook is created with, and the value that
  // route verifies incoming requests against.
  revalidateSecret: string;
};

export function loadProvisionEnv(): TProvisionEnv {
  return {
    sanityManagementToken: requireEnv('SANITY_MANAGEMENT_TOKEN'),
    sanityOrganizationId: requireEnv('SANITY_ORGANIZATION_ID'),
    vercelToken: requireEnv('VERCEL_TOKEN'),
    vercelTeamId: process.env['VERCEL_TEAM_ID'],
    vercelWebProjectId: requireEnv('VERCEL_PROJECT_ID'),
    adminAppBaseUrl: requireEnv('ADMIN_APP_BASE_URL'),
    tenantSanityDataset: requireEnv('TENANT_SANITY_DATASET'),
    webAppBaseUrl: requireEnv('WEB_APP_URL'),
    revalidateSecret: requireEnv('SANITY_REVALIDATE_SECRET'),
  };
}
