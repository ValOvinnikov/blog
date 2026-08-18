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
  vercelOrgId: string;
  // Only needed when the Vercel account is team-owned.
  vercelTeamId: string | undefined;
  // The *shared* `apps/web` Vercel project id — step 5 adds every tenant's
  // custom domain to this one project, never a per-tenant project.
  vercelWebProjectId: string;
  vercelCliVersion: string;
  // Base origin of the deployed `apps/admin` app (no trailing slash/path) —
  // both the status-callback target and the Sanity CORS origin step 1 adds.
  adminAppBaseUrl: string;
  callbackSecret: string;
  // Platform domain each tenant's Studio subdomain is minted under
  // (`studio-<slug>.<platformDomain>`) — see `studioDomainForSlug`.
  platformDomain: string;
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

const DEFAULT_VERCEL_CLI_VERSION = '48.0.0';

export function loadProvisionEnv(): TProvisionEnv {
  return {
    sanityManagementToken: requireEnv('SANITY_MANAGEMENT_TOKEN'),
    sanityOrganizationId: requireEnv('SANITY_ORGANIZATION_ID'),
    vercelToken: requireEnv('VERCEL_TOKEN'),
    vercelOrgId: requireEnv('VERCEL_ORG_ID'),
    vercelTeamId: process.env['VERCEL_TEAM_ID'],
    vercelWebProjectId: requireEnv('VERCEL_PROJECT_ID'),
    vercelCliVersion:
      process.env['VERCEL_CLI_VERSION'] ?? DEFAULT_VERCEL_CLI_VERSION,
    adminAppBaseUrl: requireEnv('ADMIN_APP_BASE_URL'),
    callbackSecret: requireEnv('TENANT_PROVISIONING_CALLBACK_SECRET'),
    platformDomain: requireEnv('PLATFORM_DOMAIN'),
    tenantSanityDataset: requireEnv('TENANT_SANITY_DATASET'),
    webAppBaseUrl: requireEnv('WEB_APP_URL'),
    revalidateSecret: requireEnv('SANITY_REVALIDATE_SECRET'),
  };
}
