import type { TMaybeUndefined } from '@blog/config/types';

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
  vercelTeamId: TMaybeUndefined<string>;
  vercelWebProjectId: string;
  tenantRootDomain: string;
  dryRun: boolean;
  githubActor: TMaybeUndefined<string>;
  githubRunId: TMaybeUndefined<string>;
  githubRepository: TMaybeUndefined<string>;
  githubServerUrl: TMaybeUndefined<string>;
  webAppUrl: TMaybeUndefined<string>;
  siteConfigRevalidateSecret: TMaybeUndefined<string>;
};

export function loadDeprovisionEnv(dryRun: boolean): TDeprovisionEnv {
  return {
    sanityManagementToken: requireEnv('SANITY_MANAGEMENT_TOKEN'),
    vercelToken: requireEnv('VERCEL_TOKEN'),
    vercelTeamId: process.env['VERCEL_TEAM_ID'],
    vercelWebProjectId: requireEnv('VERCEL_PROJECT_ID_WEB'),
    tenantRootDomain: requireEnv('TENANT_ROOT_DOMAIN'),
    dryRun,
    githubActor: process.env['GITHUB_ACTOR'],
    githubRunId: process.env['GITHUB_RUN_ID'],
    githubRepository: process.env['GITHUB_REPOSITORY'],
    githubServerUrl: process.env['GITHUB_SERVER_URL'],
    webAppUrl: process.env['WEB_APP_URL'],
    siteConfigRevalidateSecret: process.env['SITE_CONFIG_REVALIDATE_SECRET'],
  };
}
